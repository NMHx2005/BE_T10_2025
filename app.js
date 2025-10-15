const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
    res.send('Đây là trang web của tôi')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
