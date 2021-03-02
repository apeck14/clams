exports.Token = class Token {
    constructor(){
        this.tokens = [process.env.cr_token, process.env.cr_token2, process.env.cr_token3, process.env.cr_token4, process.env.cr_token5, process.env.cr_token6, process.env.cr_token7, process.env.cr_token8];
        this.tokenIndex = 0;
    }
    
    token(increment) {
        if(increment) return this.tokens[++this.tokenIndex % 8];
        else return this.tokens[this.tokenIndex % 8];
    }
}