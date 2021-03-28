const { MongoClient } = require('mongodb');
const mdbClient = new MongoClient(process.env.uri, { useUnifiedTopology: true });

module.exports = {
    connect: async () => {
        if(!mdbClient.isConnected()) await mdbClient.connect();
    },
    db: async mdb => {
        if(!mdbClient.isConnected()) await mdbClient.connect();
        return mdbClient.db(mdb);
    }
};