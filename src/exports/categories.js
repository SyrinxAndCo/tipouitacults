module.exports = {
  findById: function (id) {
    return Object.values(PUB.categories).find(v => v.id === id)
  }
}