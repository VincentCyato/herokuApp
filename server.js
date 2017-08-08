var express = require('express');
var app = express();
var session = require('cookie-session');// Charge le middleware de sessions
var bodyParser = require('body-parser'); // Charge le middleware de gestion des parametres
var urlencodedParser = bodyParser.urlencoded({ extended: false });


//  URL  us-cdbr-iron-east-05.cleardb.net/heroku_f3ce5ab7bab9107  username:b48dd40b3a071b  pwd:ff65afe1
var mysql = require('mysql');

var pool = mysql.createPool(env.process.DATABASE_URL);
/*
var pool = mysql.createPool({
	connectionLimit : 10,
  host: "sql11.freemysqlhosting.net",
  user: "sql11187090",
  password: "htmXwilHAC",
  database: "sql11187090"
});

var pool = mysql.createPool({
	connectionLimit : 10,
  host: "us-cdbr-iron-east-05.cleardb.net",
  user: "b48dd40b3a071b",
  password: "ff65afe1",
  database: "heroku_f3ce5ab7bab9107"
});
*/
app.use(session({secret: 'todotopsecret'}))

app.use(function(req, res, next){
    if (typeof(req.session.liketab) == 'undefined') {
        req.session.liketab = [];
    }
    next();
})

pool.getConnection(function(err, connection) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }

  console.log('connected as id ' + connection.threadId);
});


// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 8080;

// set the view engine to ejs
app.set('view engine', 'ejs');

// make express look in the public directory for assets (css/js/img)
app.use(express.static(__dirname + '/public'));

// set the home page route
app.get('/', function(req, res) {/*
	console.log("rendering home page");
    // ejs render automatically looks in the views folder
    res.render('index');*/
        
    	pool.getConnection(function(err, connection){
    		connection.query("SELECT * FROM `sql11187090`.`BAND` order by likes desc LIMIT 5", function (err, result)
    			{
    			    connection.query("SELECT DISTINCT genre FROM `sql11187090`.`BAND`", function(err2,genres)
    			    {
    			    	console.log("rendering home page");
        				res.render('index', {result: result, genres: genres});
        				if (err2) throw err2;
        		    });
        		    connection.release();
        		    if (err) throw err;
        		});
    	});

});

app.post('/list',urlencodedParser,function(request,response){
	//console.log("genre = "+request.body.genre);
    pool.getConnection(function(err, connection){
    	if(request.body.genre=='all')
    	{
    		connection.query("SELECT * FROM `sql11187090`.`BAND` order by likes desc LIMIT 50", function (err, result)
    		{
    		    connection.query("SELECT DISTINCT genre FROM `sql11187090`.`BAND`", function(err2,genres)
    		    {
    		    	response.render('list.ejs', {result: result, genres: genres,genre: request.body.genre});
    		    	if (err2) throw err2;
    		    });
    		    connection.release();
    		    if (err) throw err;
    		});
    	}
    	else
    	{
    		connection.query("SELECT * FROM `sql11187090`.`BAND` WHERE genre = ? order by likes desc LIMIT 50",[request.body.genre], function (err, result)
    		{
    		    connection.query("SELECT DISTINCT genre FROM `sql11187090`.`BAND`", function(err2,genres)
    		    {
    		    	response.render('list.ejs', {result: result, genres: genres,genre: request.body.genre});
    		    	if (err2) throw err2;
    		    });
    		    connection.release();
    		    if (err) throw err;
    		});
    	}
    	
    })
});


app.post('/submit',urlencodedParser,function(request,response){

	//console.log("req.genre = " + request.body.genre);
	//console.log("req.otherGenre = " + request.body.otherGenre);
	if(request.body.genre==undefined && request.body.otherGenre=='')
	{
		console.log("no genre");
	}
	else
	{
		console.log("adding band to database");
		var genre = request.body.genre;
		var band = request.body.name;
		var comment = request.body.commentary;
		if(genre==undefined)genre=request.body.otherGenre;
		console.log("band = " + band +"\ngenre = "+genre+"\ncommentary = "+comment);

		pool.getConnection(function(err, connection){		  
		  console.log("Connected!");
		  var sql = "INSERT INTO  `sql11187090`.`BAND` (id,name, genre,likes,commentary) VALUES (null,?, ?, 0 , ?)";
		  connection.query(sql,[band,genre,comment], function (err2, result) {
		    if (err2)
		    {
		    	throw err2;
		    }else
		    {
		    	console.log("1 record inserted");		    	
		    }
		    
		  });
		  connection.release();
		  if (err) throw err;
		});
	}
	response.redirect('/submit');
});

app.get('/list', function(req, res) 
{
	//connection.connect();
	pool.getConnection(function(err, connection){
		connection.query("SELECT * FROM `sql11187090`.`BAND` order by likes desc LIMIT 50", function (err, result)
		{
		    connection.query("SELECT DISTINCT genre FROM `sql11187090`.`BAND`", function(err2,genres)
		    {
		    	res.render('list.ejs', {result: result, genres: genres, genre: 'undefined'});
		    	if (err2) throw err2;
		    });
		    connection.release();
		    if (err) throw err;
		});
	})
	
	
});

app.get('/submit', function(req, res) {
	pool.getConnection(function(err, connection){
		connection.query("SELECT DISTINCT genre FROM `sql11187090`.`BAND`", function(err2,genres)
		{
			res.render('submit.ejs', { genres: genres});
			if (err2) throw err2;
		});
	});
});

app.get('/faq', function(req, res) {
	res.render('faq.ejs');
});

app.get('/like/:id', function(req, res) {
	//console.log('attemp to like band of id ' + req.params.id);
    if (req.session.liketab[req.params.id]!=true) {
        req.session.liketab[req.params.id]=true;
        pool.getConnection(function(err, connection){
        	connection.query("UPDATE `sql11187090`.`BAND` SET likes=likes+1 where id = ?", [req.params.id], function (err, result)
			{
				if (err) throw err;
			});
		});
    }
    res.redirect('/list');
})




app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});