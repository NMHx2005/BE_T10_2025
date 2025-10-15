import express from 'express'; // ES6 import
const app = express()
const port = 3000

app.get('/', (req, res) => {
    res.send('Nguyễn Văn A - 20120001')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
