const tokens = [process.env.cr_token, process.env.cr_token2, process.env.cr_token3, process.env.cr_token4, process.env.cr_token5, process.env.cr_token6, process.env.cr_token7, process.env.cr_token8];
let tokenIndex = 0;

module.exports = {
    token: (increment = false) => {
        if(increment === true) return tokens[++tokenIndex % 8];
        return tokens[tokenIndex % 8];
    }
};