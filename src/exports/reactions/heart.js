module.exports = {
  name : "Heart",
  desc : "Very complex to trigger heart reaction",
  emoji: "❤️",
  authorizations : {
    messages : {
      type: "any",
      list: []
    },
    salons : {
      type: "whitelist",
      list: [PUB.debug.botsecret]
    },
    users : {
      type: "whitelist",
      list: ["205399579884126217", "222028577405665283"]
    }
  },
  run : function(reaction, usr, type) {
    // TiCu.Log.Reactions.Heart(reaction, usr, type)
  }
}
