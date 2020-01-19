const axios = require('axios');
const Dev = require('../models/Dev');
const parseStringAsArray = require('../utils/parseStringAsArray');
const { findConnections, sendMessage } = require('../websocket');

// index, show, store, update, destroy

module.exports = {
  async index(request, response) {
    const devs = await Dev.find();

    response.json(devs);
  },

  async store(request, response) {
    const { github_username, techs, latitude, longitude } = request.body;
    let dev = await Dev.findOne({ github_username });

    if(!dev){
      const apiResponse = await axios.get(`https://api.github.com/users/${github_username}`);
      const { name = login, avatar_url, bio } = apiResponse.data;
      const techsArray = parseStringAsArray(techs);
      const location = {
        type: 'Point',
        coordinates: [latitude, longitude]
      };

      dev = await Dev.create({
        github_username,
        name,
        avatar_url,
        bio,
        techs: techsArray,
        location
      });

      // Filtrar as conexões que estão há no máximo 10km de distância
      // e que o novo dev tenha pelo menos  umas das tecnologias filtradas 
      const sendSocketMessageTo = findConnections(
        { latitude, longitude },
        techsArray
      );

      sendMessage(sendSocketMessageTo, 'new-dev', dev);
    }

    return response.json(dev);
  },

  async update(request, response){
    const { id } = request.params;
    const { github_username, techs, latitude, longitude } = request.body;
    const apiResponse = await axios.get(`https://api.github.com/users/${github_username}`);
    const { name = login, avatar_url, bio } = apiResponse.data;
    const techsArray = parseStringAsArray(techs);
    const location = {
      type: 'Point',
      coordinates: [latitude, longitude]
    };

    Dev.findOneAndUpdate({ _id: id }, { $set: {
      github_username,
      name,
      avatar_url,
      bio,
      techs: techsArray,
      location
    }}, { useFindAndModify: false }, (err, doc, res) => {
      if(!err){
        response.json({ message: "Developer updated" });
      }else{
        response.json({ message: "Failed updating developer" });
      }
    });
  },

  destroy(request, response){
    const { id } = request.params;

    Dev.deleteOne({ _id: id }, (err) => {
      if(!err){
        response.json({ message: "Developer removed" });
      }else{
        response.json({ message: "Failed removing Developer or Developer not found" });
      }
    });
  }
};