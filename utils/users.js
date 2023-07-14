let users = []

const addUser = (id, roomId) => {
  const user = { id, roomId }
  users.push(user)
  return user
}

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id)
  if (index !== -1) {
    const user = users[index]
    users.splice(index, 1)[0]
    return user
  }
}

const getList = () => {
  return users
}

module.exports = { addUser, removeUser, getList }
