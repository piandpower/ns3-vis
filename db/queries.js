var schema = require('./schema.js');

var exports = module.exports = {};

exports.autocompleteArtists = function (artist_name) {
  return schema.models.artist.find({
    name: new RegExp(artist_name, 'i')
  }, {
    _id: 0,
    artist_id: 1,
    name: 1
  }).limit(10).exec(function (err, result) {
    return result;
  });
};
exports.genres = function () {
  return schema.models.top_genres.find({}, {
    _id: 0
  }).exec();
};