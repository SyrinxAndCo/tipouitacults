module.exports = {
  name : "SuchTruc",
  desc : "Such auto ! Much function !",
  schema: "such word",
  trigger: "such",
  authorizations : {
    salons : {
      type: "whitelist",
      list: [PUB.debug.botsecret]
    },
    users : {
      type: "whitelist",
      list: ["205399579884126217", "222028577405665283"]
    }
  },
  run : function(msg) {
    msg.reply("Much auto reaction !")
    // TiCu.Log.Auto.SuchTruc(msg)
  }
}
