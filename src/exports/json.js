const fs = require("fs")
module.exports = function(data) {
  let action = data.action ? data.action : ""
  let target = data.target ? data.target : ""
  let content = data.content ? data.content : ""
  let file = fs.readFileSync(target)
  let read = JSON.parse(file)
  if(!read) { TiCu.Log.Json("err", "read"); return false }
  let write
  switch(action) {
    case "read":
      TiCu.Log.Json("read", target)
      return read
    case "write":
      write = read ? content ? {...read, ...content} : "" : ""
      if(write) {
        write = JSON.stringify(write, null, 2)
        fs.writeFileSync(target, write)
        TiCu.Log.Json("write", target)
        return true
      } else { TiCu.Log.Json("err", "write"); return false }
    case "delete":
      if(read[content]) {
        delete read[content]
        write = JSON.stringify(read, null, 2)
        fs.writeFileSync(target, write)
        TiCu.Log.Json("delete", target)
        return true
      } else { TiCu.Log.Json("err", "delete"); return false }
    default:
      TiCu.Log.Json("err", "action")
      return false
  }
}
