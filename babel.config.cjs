module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    node: 'current' // Target Node.js version hiện tại
                },
                modules: 'false' // Giữ ES modules (không convert sang CommonJS)
            }
        ]
    ]
}
