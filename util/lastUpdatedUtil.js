const { getMinsDiff } = require("./otherUtil");

const lastUpdatedUtil = {
    lastUpdated: new Date(),
    setLastUpdated: () => {
        lastUpdatedUtil.lastUpdated = new Date()
    },
    LUFooter: () => {
        return `Matches Last Updated: ${getMinsDiff(lastUpdatedUtil.lastUpdated)} min(s) ago`;
    }
};

module.exports = lastUpdatedUtil;