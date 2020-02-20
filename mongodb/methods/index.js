module.exports = {
    findWithSchema: async (Model) => {
      let data = await Model.find({});
      let committee = Model.collection.collectionName; 
      let res = data.map(datum => {
        let dataObj = datum.toObject();
        let x = { ...dataObj, committee } 
        return x;
      });
     
      return res;
    },
};
