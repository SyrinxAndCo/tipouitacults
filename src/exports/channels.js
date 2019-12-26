module.exports = {
  findById: function (id) {
    return Object.values(PUB.salons).find(v => v.id === id)
  }
}