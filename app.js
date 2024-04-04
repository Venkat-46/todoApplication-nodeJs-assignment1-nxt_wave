const express = require('express')
const path = require('path')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const dateFns = require('date-fns')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error : ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const prioritiesArray = ['HIGH', 'MEDIUM', 'LOW']
const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
const categoryArray = ['WORK', 'HOME', 'LEARNING']
const dateFormat = 'yyyy-MM-dd'

const checkPriority = priority => {
  return prioritiesArray.includes(priority)
}

const checkStatus = status => {
  return statusArray.includes(status)
}

const checkCategory = category => {
  return categoryArray.includes(category)
}

app.get('/todos/', async (request, response) => {
  const {
    priority = '',
    status = '',
    category = '',
    search_q = '',
  } = request.query

  const initiate = async () => {
    const sqlQuery = `
    select id,todo,category,priority,status,due_date as dueDate from todo 
    where todo like '%${search_q}%'and priority like '%${priority}%' and 
    status like '%${status}%' and category like '%${category}%';`
    const result = await db.all(sqlQuery)
    return result
  }

  if (status !== '' && priority !== '') {
    if (checkPriority(priority) === false) {
      response.status(400)
      response.send('Invalid Todo Priority')
    } else if (checkStatus(status) === false) {
      response.status(400)
      response.send('Invalid Todo Status')
    } else {
      const finalResult = await initiate()
      response.send(finalResult)
    }
  } else if (status !== '' && category !== '') {
    if (checkCategory(category) === false) {
      response.status(400)
      response.send('Invalid Todo Category')
    } else if (checkStatus(status) === false) {
      response.status(400)
      response.send('Invalid Todo Status')
    } else {
      const finalResult = await initiate()
      response.send(finalResult)
    }
  } else if (priority !== '' && category !== '') {
    if (checkCategory(category) === false) {
      response.status(400)
      response.send('Invalid Todo Category')
    } else if (checkPriority(priority) === false) {
      response.status(400)
      response.send('Invalid Todo Priority')
    } else {
      const finalResult = await initiate()
      response.send(finalResult)
    }
  } else if (category !== '') {
    if (checkCategory(category) === false) {
      response.status(400)
      response.send('Invalid Todo Category')
    } else {
      const finalResult = await initiate()
      response.send(finalResult)
    }
  } else if (priority !== '') {
    if (checkPriority(priority) === false) {
      response.status(400)
      response.send('Invalid Todo Priority')
    } else {
      const finalResult = await initiate()
      response.send(finalResult)
    }
  } else if (status !== '') {
    if (checkStatus(status) === false) {
      response.status(400)
      response.send('Invalid Todo Status')
    } else {
      const finalResult = await initiate()
      response.send(finalResult)
    }
  } else {
    const finalResult = await initiate()
    response.send(finalResult)
  }

  app.get('/todos/:todoId/', async (request, response) => {
    const {todoId} = request.params

    const getTodoQuery = `
    select id,todo,priority,status,category,due_date as dueDate from todo where id=${todoId};`

    const todo = await db.get(getTodoQuery)
    response.send(todo)
  })
})

app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  try {
    const neededFormat = dateFns.format(new Date(date), dateFormat)
    const getTodosBasedOnDateQ = `SELECT id,todo,priority,status
    ,category,due_date AS dueDate FROM todo 
    WHERE due_date='${neededFormat}';`
    const result = await db.all(getTodosBasedOnDateQ)
    response.send(result)
  } catch (error) {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

app.post('/todos/', async (request, response) => {
  const {id, todo, status, priority, category, dueDate} = request.body
  if (checkStatus(status) === false) {
    response.status(400)
    response.send('Invalid Todo Status')
  } else if (checkPriority(priority) === false) {
    response.status(400)
    response.send('Invalid Todo Priority')
  } else if (checkCategory(category) === false) {
    response.status(400)
    response.send('Invalid Todo Category')
  } else {
    try {
      const neededDateFormat = dateFns.format(new Date(dueDate), dateFormat)
      const createTodoQuery = `
      insert into todo (id,todo,priority,status,category,due_date)
      values (${id},'${todo}','${priority}','${status}','${category}','${neededDateFormat}') ;`
      await db.run(createTodoQuery)
      response.send('Todo Successfully Added')
    } catch (error) {
      response.status(400)
      response.send('Invalid Due Date')
    }
  }
})

app.put('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const {todo, status, category, priority, dueDate} = request.body

  if (status !== undefined) {
    if (checkStatus(status) === false) {
      response.status(400)
      response.send('Invalid Todo Status')
    } else {
      const toUpdateStatusQuery = `
      update todo set status='${status}' where id=${todoId};`

      await db.run(toUpdateStatusQuery)
      response.send('Status Updated')
    }
  } else if (priority !== undefined) {
    if (checkPriority(priority) === false) {
      response.status(400)
      response.send('Invalid Todo Priority')
    } else {
      const toUpdatePriority = `update todo set priority='${priority}'
      where id=${todoId};`
      await db.run(toUpdatePriority)
      response.send('Priority Updated')
    }
  } else if (category !== undefined) {
    if (checkCategory(category) === false) {
      response.status(400)
      response.send('Invalid Todo Category')
    } else {
      const toUpdateCategory = `
    update todo set category='${category}' where id=${todoId};`
      await db.run(toUpdateCategory)
      response.send('Category Updated')
    }
  } else if (dueDate !== undefined) {
    try {
      const neededDateFormat = dateFns.format(new Date(dueDate), dateFormat)
      const toUpdateDueDate = `
  update todo set due_date='${neededDateFormat}' where id=${todoId};`
      await db.run(toUpdateDueDate)
      response.send('Due Date Updated')
    } catch (error) {
      response.status(400)
      response.send('Invalid Due Date')
    }
  } else {
    const toUpdateTodo = `update todo set todo='${todo}' where id=${todoId};`
    await db.run(toUpdateTodo)
    response.send('Todo Updated')
  }
})

app.delete('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const todoDeleteQuery = `
  delete from todo where id=${todoId};`
  await db.run(todoDeleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
