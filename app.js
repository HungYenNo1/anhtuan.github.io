const express = require('express');
const oracledb = require('oracledb');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');

dotenv.config();

const app = express();
const port = 3000;
const host = 'localhost';

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Cấu hình session
app.use(session({
    secret: 'your_secret_key',  // Thay 'your_secret_key' bằng khóa bí mật của bạn
    resave: false,
    saveUninitialized: true,
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000, // 24 giờ (thời gian sống của session)
        secure: false // Đặt thành true nếu bạn sử dụng HTTPS
    }
}));

async function getOracleConnection() {
    try {
        return await oracledb.getConnection({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_CONNECT_STRING
        });
    } catch (err) {
        console.error('Failed to get Oracle connection:', err);
    }
}

//Đăng nhập
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    let connection;
    try {
        connection = await getOracleConnection();
        const result = await connection.execute(
            `SELECT ID, USERID, HOTEN FROM HSOFTTAMANH.DLOGIN WHERE USERID = :username`,
            { username }
        );

        if (result.rows.length === 0 ) {
            res.render('login', { error: 'Tên đăng nhập và mật khẩu không hợp lệ!' });
        } else {
            // Lưu thông tin vào session
            req.session.loggedin = true;
            req.session.username = username;
            req.session.fullname = result.rows[0][2]; // Giả sử HOTEN ở vị trí thứ 3 trong kết quả
            req.session.ip = req.ip;

            res.redirect('/'); // Chuyển hướng đến trang chủ sau khi đăng nhập thành công
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error connecting to database');
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return console.log(err);
        }
        res.redirect('/login'); // Chuyển hướng về trang đăng nhập sau khi đăng xuất
    });
});

app.get('/', (req, res) => {
    if (req.session.loggedin) {
        res.render('index', { fullname: req.session.fullname, ip: req.session.ip });
    } else {
        res.redirect('/login');
    }
});

app.get('/menu-item-1', async (req, res) => {
    if (!req.session.loggedin) {
        return res.redirect('/login'); // Chuyển hướng đến trang đăng nhập nếu chưa đăng nhập
    }
    
    let connection;
    try {
        connection = await getOracleConnection();
        const result = await connection.execute(
            `SELECT ID, MA, TEN, MAKP FROM HSOFTTAMANH.D_DUOCKP WHERE ID NOT IN ('16', '46','123','124','127', '128', '151') ORDER BY TEN`
        );
        const makpResult = await connection.execute(
            `SELECT MAKP, TENKP FROM HSOFTTAMANH.BTDKP_BV ORDER BY TENKP`
        );
        res.render('menu-item-1', { 
            data: result.rows, 
            makpData: makpResult.rows, 
            fullname: req.session.fullname, 
            ip: req.session.ip 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error connecting to database');
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
});

app.post('/update-status', async (req, res) => {
    const { id, action, makp } = req.body;

    let connection;
    try {
        connection = await getOracleConnection();

        // Lấy mã khoa cũ trước khi cập nhật
        const oldMakpResult = await connection.execute(
            `SELECT MAKP FROM HSOFTTAMANH.D_DUOCKP WHERE ID = :id`,
            { id }
        );
        const oldMakp = oldMakpResult.rows[0][0];

        const makpMap = {
            '1': '001',
            '2': '007',
            '3': '008',
            '5': '014',
            '6': '002',
            '7': '109',
            '8': '999',
            '9': '111',
            '10': '105',
            '11': '006',
            '12': '112',
            '16': '152',
            '17': '999',
            '22': '002',
            '23': '017',
            '26': '010',
            '27': '013',
            '28': '063',
            '29': '018',
            '30': '019',
            '31': '021',
            '32': '020',
            '33': '003',
            '35': '016',
            '40': '034',
            '41': '034',
            '43': '024',
            '45': '027',
            '47': '031',
            '48': '032',
            '49': '033',
            '51': '057',
            '55': '022',
            '56': '023',
            '57': '041',
            '59': '055',
            '60': '009',
            '61': '038',
            '62': '015',
            '63': '052',
            '65': '054',
            '66': '130',
            '67': '040',
            '69': '061',
            '70': '058',
            '71': '059',
            '72': '060',
            '73': '062',
            '74': '026',
            '75': '064',
            '78': '028',
            '84': '075',
            '87': '067',
            '88': '076',
            '89': '093',
            '90': '078',
            '91': '045',
            '92': '080',
            '93': '088',
            '94': '089',
            '95': '090',
            '96': '091',
            '97': '092',
            '98': '104',
            '99': '057',
            '100': '105',
            '104': '156',
            '105': '149',
            '106': '114',
            '107': '111',
            '108': '077',
            '112': '118',
            '113': '006',
            '114': '112',
            '115': '045',
            '116': '074',
            '117': '037',
            '118': '128',
            '119': '108',
            '120': '093',
            '121': '094',
            '122': '136',
            '130': '184',
            '131': '148',
            '132': '117',
            '133': '150',
            '134': '151',
            '135': '152',
            '136': '154',
            '137': '153',
            '141': '156',
            '142': '157',
            '143': '079',
            '144': '169',
            '145': '170',
            '146': '112',
            '148': '172',
            '149': '173',
            '150': '104',
            '152': '155',
            '154': '176',
            '155': '177',
            '156': '006',
            '157': '112',
            '158': '204',
            '159': '006',
            '160': '138',
            '162': '212',
            '163': '203',
            '164': '006',
            '165': '017',
            '166': '234',
            '167': '233',
            '168': '211',
            '169': '006',
            '171': '270',
            '172': '271',
            '173': '267',
            '174': '273',
            '175': '267',
            '176': '267',
            '177': '267',
            '178': '279',
        };

        // Thực hiện cập nhật mã khoa phòng
        let newMakp;
        if (action === 'dong') {
            newMakp = makpMap[id] || '000'; 
        } else if (action === 'mo') {
            newMakp = ['11', '113', '17', '8', '91', '84', '88', '43', '106', '142', '109', '108', '148', '90', '105', '9', '107', '23', '104', '59', '135', '10', '112', '63', '89'].includes(id) ? '056' : null;
        } else if (action === 'update') {
            newMakp = makp;
        } else if (action === 'setNull') {
            newMakp = null;
        } else if (action === 'setDefault') {
            newMakp = makpMap[id] || '000';
        }

        await connection.execute(
            `UPDATE HSOFTTAMANH.D_DUOCKP SET MAKP = :makp WHERE ID = :id`,
            { makp: newMakp, id },
            { autoCommit: true }
        );

        // Ghi log
        const slog_module = 'DM_VTYT';
        const slog_event = action === 'dong' ? 'Close' : action === 'mo' ? 'Open' : 'Update';
        const slog_log_old = oldMakp || 'NULL';
        const slog_log_new = newMakp || 'NULL';
        const slog_note = `Cập nhật: ${slog_log_old} -> ${slog_log_new}`;
        const slog_userid = req.session.username;
        const slog_computer = req.hostname;
        const slog_hostip = req.session.ip;

        await writeLog(slog_userid, slog_computer, slog_hostip, slog_module, slog_event, slog_log_old, slog_log_new, slog_note);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
});

app.get('/menu-item-2', async (req, res) => {
    if (!req.session.loggedin) {
        return res.redirect('/login'); // Chuyển hướng đến trang đăng nhập nếu chưa đăng nhập
    }

    res.render('menu-item-2', { 
        fullname: req.session.fullname, 
        ip: req.session.ip 
    });
});

app.post('/search-pid', async (req, res) => {
    const { pid } = req.body;

    let connection;
    try {
        connection = await getOracleConnection();
        const result = await connection.execute(
            `SELECT 
                a.MABN AS ma_bn,
                a.HOTEN AS ho_ten,
                a.NAMSINH AS nam_sinh,
                a.SONHA AS so_nha,
                a.MATT AS ma_tinh,
                b.TENTT AS ten_tinh,
                a.MAQU AS ma_huyen,
                c.TENQUAN AS ten_huyen,
                a.MAPHUONGXA AS ma_xa,
                d.TENPXA AS ten_xa 
             FROM HSOFTTAMANH.btdbn a 
             LEFT JOIN HSOFTTAMANH.btdtt b ON (b.MATT = a.MATT)
             LEFT JOIN HSOFTTAMANH.btdquan c ON (c.MATT = a.MATT AND c.MAQU = a.MAQU)
             LEFT JOIN HSOFTTAMANH.btdpxa d ON (d.MAQU = a.MAQU AND d.MAPHUONGXA = a.MAPHUONGXA)
             WHERE MABN = :id`, 
            { id: pid }
        );

        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
});

app.get('/get-tinh', async (req, res) => {
    let connection;
    try {
        connection = await getOracleConnection();
        const result = await connection.execute(
            `SELECT MATT AS ma_tinh, TENTT AS ten_tinh FROM HSOFTTAMANH.BTDTT WHERE HIDE = 0 ORDER BY MATT`
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
});

app.get('/get-huyen/:ma_tinh', async (req, res) => {
    const { ma_tinh } = req.params;

    let connection;
    try {
        connection = await getOracleConnection();
        const result = await connection.execute(
            `SELECT MAQU AS ma_huyen, MATT AS ma_tinh, TENQUAN AS ten_huyen FROM HSOFTTAMANH.BTDQUAN WHERE HIDE = 0 AND MATT = :ma_tinh ORDER BY MAQU`,
            { ma_tinh }
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
});

app.get('/get-xa/:ma_huyen', async (req, res) => {
    const { ma_huyen } = req.params;

    let connection;
    try {
        connection = await getOracleConnection();
        const result = await connection.execute(
            `SELECT MAPHUONGXA AS ma_xa, MAQU AS ma_huyen, TENPXA AS ten_xa FROM HSOFTTAMANH.BTDPXA WHERE HIDE = 0 AND MAQU = :ma_huyen ORDER BY MAPHUONGXA`,
            { ma_huyen }
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
});

app.post('/update-btdbn', async (req, res) => {
    const { pid, ma_tinh, ma_huyen, ma_xa, sonha } = req.body;

    let connection;
    try {
        connection = await getOracleConnection();

        // Lấy thông tin địa chỉ cũ
        const oldAddressResult = await connection.execute(
            `SELECT MATT, MAQU, MAPHUONGXA FROM HSOFTTAMANH.BTDBN WHERE MABN = :pid`,
            { pid }
        );
        const oldAddress = oldAddressResult.rows[0];

        await connection.execute(
            `UPDATE HSOFTTAMANH.BTDBN SET MATT = :ma_tinh, MAQU = :ma_huyen, MAPHUONGXA = :ma_xa, SONHA = :sonha WHERE MABN = :pid`,
            { pid, ma_tinh, ma_huyen, ma_xa, sonha },
            { autoCommit: true }
        );

        // Ghi log
        const slog_module = 'DM_DIACHI';
        const slog_event = 'Sửa địa chỉ';
        const slog_log_old = `${oldAddress[0]}-${oldAddress[1]}-${oldAddress[2]}`;
        const slog_log_new = `${ma_tinh}-${ma_huyen}-${ma_xa}`;
        const slog_note = `Sửa địa chỉ cũ: ${slog_log_old} -> ${slog_log_new}`;
        const slog_userid = req.session.username;
        const slog_computer = req.hostname;
        const slog_hostip = req.session.ip;

        await writeLog(slog_userid, slog_computer, slog_hostip, slog_module, slog_event, slog_log_old, slog_log_new, slog_note);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
});


//Lưu log
const os = require('os');  // Module os cho phép lấy thông tin hệ thống

async function writeLog(slog_userid, slog_computer, slog_hostip, slog_module, slog_event, slog_log_old, slog_log_new, slog_note) {
    let connection;
    try {
        connection = await getOracleConnection();

        // Truy vấn SLOG_MANV từ bảng HSOFTTAMANH.DLOGIN dựa trên SLOG_USERID
        const manvResult = await connection.execute(
            `SELECT ID FROM HSOFTTAMANH.DLOGIN WHERE USERID = :userid`,
            { userid: slog_userid }
        );

        const slog_manv = manvResult.rows.length > 0 ? manvResult.rows[0][0] : null;

        if (!slog_manv) {
            throw new Error('User ID not found in DLOGIN');
        }

        // Lấy ID lớn nhất hiện tại và tăng thêm 1 để tạo SLOG_ID mới
        const result = await connection.execute(`SELECT NVL(MAX(SLOG_ID), 0) + 1 AS NEXT_ID FROM HSOFTTAMANH.SYSTEM_LOG`);
        const nextSlogId = result.rows[0][0];

        // Lấy tên máy tính
        const slog_computer = os.hostname();

        await connection.execute(
            `INSERT INTO HSOFTTAMANH.SYSTEM_LOG (
                SLOG_ID, SLOG_MANV, SLOG_USERID, SLOG_TIME, SLOG_COMPUTER, SLOG_HOSTIP, 
                SLOG_MODULE, SLOG_EVENT, SLOG_LOG_OLD, SLOG_LOG_NEW, SLOG_NOTE
            ) VALUES (
                :slog_id, :slog_manv, :slog_userid, SYSDATE, :slog_computer, :slog_hostip, 
                :slog_module, :slog_event, :slog_log_old, :slog_log_new, :slog_note
            )`,
            {
                slog_id: nextSlogId,
                slog_manv: slog_manv,
                slog_userid: slog_userid,
                slog_computer: slog_computer,
                slog_hostip: slog_hostip,
                slog_module: slog_module,
                slog_event: slog_event,
                slog_log_old: slog_log_old,
                slog_log_new: slog_log_new,
                slog_note: slog_note
            },
            { autoCommit: true }
        );
    } catch (err) {
        console.error('Failed to write log:', err);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}

// Sửa bệnh phẩm
app.get('/menu-item-3', (req, res) => {
    if (!req.session.loggedin) {
        return res.redirect('/login'); // Chuyển hướng đến trang đăng nhập nếu chưa đăng nhập
    }
    
    res.render('menu-item-3', {
        fullname: req.session.fullname, 
        ip: req.session.ip
    });
});

app.post('/search-chidinh', async (req, res) => {
    const { pid, month, year } = req.body;

    // Pad the month with leading zero if needed (e.g., "2" becomes "02")
    const paddedMonth = month.padStart(2, '0');

    // Use the last two digits of the year (e.g., "2024" becomes "24")
    const shortYear = year.slice(-2);

    // Construct the schema name dynamically based on the selected month and year
    const schemaName = `hsofttamanh${paddedMonth}${shortYear}`;

    let connection;
    try {
        connection = await getOracleConnection();
        const result = await connection.execute(
            `SELECT 
                TO_CHAR(a.ID) AS idchidinh,
                b.ten AS tenchidinh, 
                c.hoten AS tenbn,
                a.MAVP AS mavp,
                a.BENHPHAM AS benhpham,
                a.MADOITUONG AS doituong,
                a.PAID AS tt_thuphi,
                a.DONE AS tt_thuchien,
                a.IDDIENBIEN AS id_dienbien,
                TO_CHAR(a.NGAY, 'DD/MM/YYYY HH24:MI:SS') AS ngaychidinh,
                TO_CHAR(a.NGAYNHANMAU, 'DD/MM/YYYY HH24:MI:SS') AS ngaynhanmau,
                TO_CHAR(a.NGAYDOCKQ, 'DD/MM/YYYY HH24:MI:SS') AS ngaydockq,
                a.MABS AS mabs,
                a.MAKP AS makp,
                a.MAPHIEU AS maphieu,
                a.MAQL AS maquanly 
             FROM ${schemaName}.v_chidinh a,
            hsofttamanh.v_giavp b, hsofttamanh.btdbn c  
             WHERE 
                a.mabn = :pid 
                AND a.mavp = b.id 
                AND a.mabn = c.mabn
                AND EXTRACT(MONTH FROM a.NGAY) = :month
                AND EXTRACT(YEAR FROM a.NGAY) = :year
             ORDER BY a.NGAY`,
            { pid, month, year }
        );

        //console.log(`SELECT * FROM ${schemaName}.v_chidinh`); // Thêm console.log để kiểm tra

        const patientName = result.rows.length > 0 ? result.rows[0][2] : '';

        res.json({ success: true, data: result.rows, patientName });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
});

app.get('/get-benhpam', async (req, res) => {
    let connection;
    try {
        connection = await getOracleConnection();
        const result = await connection.execute(
            `SELECT ID, TEN FROM HSOFTTAMANH.DMBENHPHAM ORDER BY TEN`
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
});

app.post('/update-chidinh-benhpam', async (req, res) => {
    const { chidinhId, benhpamId, month, year } = req.body;

    // Pad the month with leading zero if needed (e.g., "2" becomes "02")
    const paddedMonth = month.padStart(2, '0');

    // Use the last two digits of the year (e.g., "2024" becomes "24")
    const shortYear = year.slice(-2);

    // Construct the schema name dynamically based on the selected month and year
    const schemaName = `hsofttamanh${paddedMonth}${shortYear}`;

    let connection;
    try {
        connection = await getOracleConnection();

        // Lấy mã bệnh phẩm cũ trước khi cập nhật
        const oldBenhphamResult = await connection.execute(
            `SELECT BENHPHAM FROM ${schemaName}.V_CHIDINH WHERE ID = :chidinhId`,
            { chidinhId }
        );
        const oldBenhpham = oldBenhphamResult.rows.length > 0 ? oldBenhphamResult.rows[0][0] : null;

        // Cập nhật mã bệnh phẩm mới
        await connection.execute(
            `UPDATE ${schemaName}.V_CHIDINH SET BENHPHAM = :benhpamId WHERE ID = :chidinhId`,
            { benhpamId, chidinhId },
            { autoCommit: true }
        );

        // Ghi log
        const slog_module = 'DM_BP';
        const slog_event = 'Sửa bệnh phẩm';
        const slog_log_old = oldBenhpham || 'NULL';
        const slog_log_new = benhpamId || 'NULL';
        const slog_note = `Sửa bệnh phẩm ID ${chidinhId}: ${slog_log_old} -> ${slog_log_new}`;
        const slog_userid = req.session.username;
        const slog_computer = req.hostname;
        const slog_hostip = req.session.ip;

        await writeLog(slog_userid, slog_computer, slog_hostip, slog_module, slog_event, slog_log_old, slog_log_new, slog_note);

        res.json({ success: true });
    } catch (err) {
        console.error('Failed to update V_CHIDINH:', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`App is running at http://10.8.88.139:${port}`);
});

/*
app.listen(port, () => {
    console.log(`App is running at http://${host}:${port}`);
});
*/