var schema = require('./schema.js');
const Promise = require('bluebird');

var exports = module.exports = {};

exports.articlesFor = (topic) => {
  return schema.models.source.all({
    include: [
      {
        model: schema.models.article,
        where: {
          'topicId': topic,
        },
      }
    ],
    order: ['source.name'],
    attributes: {
      include: [[schema.db.fn('AVG', schema.db.col('articles.bias')), 'bias']]
    },
    group: ['source.id', 'articles.id'],
  }).then((results) => {
    results.forEach((result) => {
      result.articles.length = 5; // cap at 5 articles, should use SQL limit btu complicated to preserve avg
    });
    return results;
  });
};

exports.previews = (topic) => {
  return schema.models.topic.findAll({
    where: {
        visible: true
    }
  }).then((topics) => {
    return Promise.map(topics, (topic) => {
      return schema.models.source.all({
        include: [
          {
            model: schema.models.article,
            where: {
              'topicId': topic,
            },
          }
        ],
        order: ['source.name'],
        attributes: {
          include: [[schema.db.fn('AVG', schema.db.col('articles.bias')), 'bias']]
        },
        group: ['source.id', 'articles.id'],
      }).then((results) => {
        results.forEach((result) => {
          result.articles.length = 0; // Empty out the articles array, we only need the overall bias score for the topic
        });
        return results;
      });
    };
  });
};

exports.topicName = (topicId) => {
  var topic = schema.models.topic.findById(topicId);
  return topic;
}

exports.topics = () => {
  return schema.models.topic.findAll({
    where: {
        visible: true
    }
  }).then((topics) => { return topics; });
}

exports.sourceByName = (sourceName) => {
  return source = schema.models.source.findAll({
      where: {
        name: sourceName
      }
  }).then((sources) => {
      return sources[0];
  })
}

exports.fillArticleBiases = () => {
    return schema.models.article.findAll({attributes : ['id'], where: { archivalDataFlag: 0}}).then((articles) => {
      return Promise.map(articles, (article) => {
          return schema.models.sentence.findAll({
              attributes: ['id', 'bias'],
              where: {
                'articleId': article.id,
              }
          }).then((sentences) => {
              var totalSum = 0;``
              sentences.forEach((sentence) => { totalSum += sentence.bias });
              article.bias = -10 * (sentences.length == 0 ? 0 : totalSum / sentences.length);
              // console.log("Setting bias of", article.id, "to", article.bias);
              return schema.models.article.update({
                  bias: article.bias
              }, {
                  where: {
                    'id': article.id
                  },
                  returning: true,
                  plain: true
              }).then((result) => {});
          });
      })
    });
}

exports.articleBias = (articleId) => {
  var totalSum;
  return schema.models.article.findById(articleId, { plain: true }).then((article) => {
    if (!article) return 0;
    return schema.models.sentence.findAll(
        { where: { 'articleId': articleId },
          order: [['id', 'ASC']]
        }).then((sentences) => {
        var result = article.get({plain: true});
        result.sentences = sentences;
        return result;
      });
  });
}