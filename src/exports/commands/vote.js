function voteThreshold(type) {
  switch (type) {
    case "kick":
      return 8
    case "ban":
      return 12
    case "turquoise":
      return Math.floor(tipoui.roles.get(PUB.roles.turquoise.id).members.size*42/100)
    case "text":
      return -1
  }
}

function addReactionsToMessage(msg) {
  msg.react(VotesEmojis[0])
    .then(async function() {
      await msg.react(VotesEmojis[1])
      await msg.react(VotesEmojis[2])
      await msg.react(VotesEmojis[3])
    })
}

function createJsonForAnonVote(msg, target, type) {
  let json = {"action": "write", "content" :{}}
  json.target = VotesFile
  json.content[msg.id] = {}
  json.content[msg.id].date = TiCu.Date("fr")
  json.content[msg.id].chan = msg.channel.id
  json.content[msg.id].type = type
  if(target) {json.content[msg.id].target = target.id}
  json.content[msg.id].threshold = voteThreshold(type)
  json.content[msg.id].votes = {"oui":[], "non":[], "blanc":[], "delai":[]}
  return json
}

module.exports = {
  alias: [
    'vote'
  ],
  activated: true,
  authorizations : {
    chans : {
      type: "any"
    },
    auths : {
      type: "any"
    },
    roles : {
      type: "any"
  },
    name : "Vote",
    desc : "Lancer un vote public ou anonymisé, éventuellement pour kick/ban/turquoise.",
    schema : "!vote <anon|anonyme> <turquoise|kick|ban> <@>\nou\n!vote <anon|anonyme> <text> (texte)\nou\n!vote (texte)",
    channels : "Tous (public ou anon) ou Automodération/Salle des Votes (anon+kick/ban) ou Salle des Votes (anon+turquoise)",
    authors : "Toustes",
    roleNames : "Tous"
  },
  run : function(params, msg) {
    let crop, target
    let anon = params[0] === "anon" || params[0] === "anonyme"
    let type = params[1]
    if(anon){
      if(type === "kick" || type === "ban") {
        if(msg.channel.id === PUB.salons.salleDesVotes.id || msg.channel.id === PUB.salons.automoderation.id) {
          if(params[2]) {target = TiCu.Mention(params[2])}
          else { return TiCu.Log.Error("vote", "les votes de kick et de ban nécessitent une cible")}
        } else {return TiCu.Log.Error("vote", "les votes de kick et de ban sont restreints aux salons <#" + PUB.salons.automoderation.id + "> et <#" + PUB.salons.salleDesVotes.id +">", msg)}
      } else if(type === "turquoise") {
        if(msg.channel.id === PUB.salons.salleDesVotes.id) {
          if(params[2]) {target = TiCu.Mention(params[2])}
          else { return TiCu.Log.Error("vote", "les votes de passage Turquoise nécessitent une cible")}
        } else {return TiCu.Log.Error("vote", "les votes de passage Turquoise sont restreints au salon <#" + PUB.salons.salleDesVotes.id + ">", msg)}
      } else if(type !== "text") {return TiCu.Log.Error("vote", "quel type de vote ?", msg)}
      if(typeof target != "object" && type !== "text") {return TiCu.Log.Error("vote", "cible invalide")}
      crop = new RegExp(/^!vote\s+[^\s]+\s+/)
      if(!msg.content.match(crop)) {return TiCu.Log.Error("vote", "il manque des paramètres", msg)}
      msg.channel.send(TiCu.VotesCollections.CreateEmbedAnon(target, type, voteThreshold(type)))
        .then(newMsg => {
          if(TiCu.json(createJsonForAnonVote(newMsg, target, type))) {
            addReactionsToMessage(newMsg)
            TiCu.VotesCollections.Init(type, newMsg)
            TiCu.Log.Commands.Vote.Anon(type, params, newMsg, msg)
          } else TiCu.Log.Error("vote", "erreur d'enregistrement du vote", msg)
        })
    } else if(msg.channel.id === PUB.salons.salleDesVotes.id) {return TiCu.Log.Error("vote", "seuls les votes anonymisés sont autorisés dans <#" + PUB.salons.salleDesVotes.id + ">")}
    else {
      addReactionsToMessage(msg)
      TiCu.Log.Commands.Vote.Public(msg)
    }
  },
  autoTurquoise: function(targetId, voteNumber) {
    const targetMember = tipoui.members.get(targetId)
    if (targetMember && !targetMember.roles.get(PUB.roles.turquoise.id)) {
      tipoui.channels.get(PUB.salons.salleDesVotes.id).send(`Vote automatique de passage Turquoise #${voteNumber} pour ${targetMember}`)
        .then(newMsg => {
          if (TiCu.json(createJsonForAnonVote(newMsg, targetMember, 'turquoise'))) {
            addReactionsToMessage(newMsg)
            TiCu.VotesCollections.Init('turquoise', newMsg)
            TiCu.Log.Commands.Vote.AutoTurquoise(newMsg, targetId, voteNumber)
          } else TiCu.Log.XP.error(TiCu.Xp.errorTypes.AUTOVOTE, targetId)
        })
    }
  }
}
