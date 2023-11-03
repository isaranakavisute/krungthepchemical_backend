var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const noCache = require('nocache')
const validator  = require('express-validator');
const mysqlService = require('./mysqlService/index');
const jwt = require('jsonwebtoken');


const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const adminRouter = require('./routes/admin-auth');
const otp_verifyRouter = require('./routes/otp-verify')
const productsRouter = require("./routes/products")
const cartsRouter = require("./routes/carts")
const blogsRouter = require("./routes/blogs")
const paymentRouter = require("./routes/payment")
const orderRouter = require("./routes/order")
const dashboardRouter = require("./routes/dashboard")
const viewsRouter = require("./routes/page-views")
const sliderRouter = require("./routes/slider")
const subRouter = require("./routes/subscribes")

var app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8080","http://localhost:80","http://localhost:8000","http://127.0.0.1:8000","https://lkjhgfdsa.nezharf.com/","https://asdfghjkl.nezharf.com/","https://huay-gu.com/"],
  // origin: '*',
  "credentials":true
}))

//##   Security   ##//
app.use(noCache())
app.use(helmet.dnsPrefetchControl());
app.use(helmet.frameguard({ action: 'sameorigin' }));
app.use(helmet.hidePoweredBy({ setTo: 'PHP 4.2.0' }));
const sixtyDaysInSeconds = 5184000
// app.use(helmet.hsts({
//   // ...
//   maxAge: sixtyDaysInSeconds,
//   includeSubDomains: false
// }));
const hstsMiddleware = helmet.hsts({
  maxAge: sixtyDaysInSeconds,
  includeSubDomains: false
})

app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
//##   --------   ##//

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// SQL init
mysqlService.init(success => {
  console.log('mysqlService init');
  if (success) {
    console.log('connection mysql');
  }else{
    console.log('connection error');
  }
});

app.use(async function(req, res, next) {
  if (req.secure) {
    hstsMiddleware(req, res, next)
  } else {
    next()
  }
})

const middleware = (req, res, next) => {
  /* ตรวจสอบว่า authorization คือ Boy หรือไม่*/
  // if(req.headers.authorization === "Boy")
  //   next(); //อนุญาตให้ไปฟังก์ชันถัดไป
  // else
  //   res.send("ไม่อนุญาต")

  try {
    console.log(req.headers)
    if (!req.headers["authorization"]) return res.sendStatus(401)
    console.log(req.headers["authorization"])
    const token = req.headers["authorization"].replace("Bearer", "")
    console.log(token)

    jwt.verify(token, "token", (err, decoded) => {
      if (err) throw next(createError(404));
    })
    next()
  } catch (error) {
    console.log(error)
    return res.sendStatus(403)
  }
};

app.use('/api', indexRouter);
app.use('/api', authRouter);
// app.use('/api/admin',middleware, dashboardRouter);
app.use('/api', usersRouter);
app.use('/api', adminRouter);
app.use('/api', otp_verifyRouter);
app.use('/api', productsRouter);
app.use('/api', cartsRouter);
app.use('/api', blogsRouter);
app.use('/api', paymentRouter);
app.use('/api', orderRouter);
app.use('/api', viewsRouter);
app.use('/api', dashboardRouter);
app.use('/api', sliderRouter);
app.use('/api', sliderRouter);
app.use('/api', subRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
