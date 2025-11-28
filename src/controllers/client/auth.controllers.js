

// Cấu trúc của 1 controller chuẩn

const register = async (req, res) => {
    try {
        // 1. Lấy dữ liệu từ req
        // req.body (dữ liệu từ post/put reqest), req.params (tham số từ url), req.query (query string), req.headers (HTTP headers)
        const { username, email, password = "" } = req.body;
        console.log('Register data:', { username, email, password });
        // 2 Validate dữ liệu
        // Nếu không hợp lệ -> trả về lỗi
        if (!email || !password) {

            return res.status(400).json({
                message: 'Vui lòng điền đầy đủ thông tin'
            })
        }

        // 3: Xử lý business logic
        // Gọi services, hoặc model
        // Xử lý dữ liệu
        // const user = await User.create({ username, email, password });

        // 4. Trả về response thành công hoặc thất bại

        res.status(201).json({
            message: 'Đăng Kí Thành Công'
        })


    } catch (error) {
        // Xử lý lỗi
        console.error('Error during user registration:', error);
        return res.status(500).json({
            message: error.message
        });
    }
}

const login = (req, res) => {
    res.send('Register endpoint');
}

const logout = (req, res) => {
    res.send('Register endpoint');
}

const getLoginPage = (req, res) => {
    res.send('Trang đăng nhập người dùng');
}
const getRegisterPage = (req, res) => {
    res.send('Trang đăng kí người dùng');
}
const getLogoutPage = (req, res) => {
    res.send('Trang đăng xuất người dùng');
}


export { register, login, logout, getLoginPage, getRegisterPage, getLogoutPage };