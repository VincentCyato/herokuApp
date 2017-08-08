var express = require('express');
var app = express();
var mysql = require('mysql');
var pool = mysql.createPool({
	connectionLimit : 10,
  host: "sql11.freemysqlhosting.net",
  user: "sql11187090",
  password: "htmXwilHAC",
  database: "sql11187090"
});

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

app.listen(port, function() {
    console.log('Our app is running on http://localhost:' + port);
});