import express from 'express';
import {Client} from 'pg'
import jwt from 'jsonwebtoken'

interface MYJWTinterface extends jwt.JwtPayload {
  userid : string
}

const app = express();
const PG_client = new Client('');
const JWT_KEY = "Postgress-db";



 PG_client.connect();

app.use(express.json());


async function UserSchema() {
  try {
     const response1 = await PG_client.query(`
     CREATE TABLE Users(
     id  SERIAL PRIMARY KEY,
     email varchar(50) not null,
      password varchar(50) not null,
      username varchar(50) not null
     ); 
    `) 
     console.log("User Schema Created !!");
     console.log(response1);
  } catch (error) {
    console.log("User Schema Not been Created !!");
  }
}


async function TODOSchema() {
  try {
     const response1 = await PG_client.query(`
    CREATE TABLE Todos (
  id SERIAL PRIMARY KEY,
  userid INTEGER NOT NULL,
  task VARCHAR(255) NOT NULL,
  FOREIGN KEY (userid) REFERENCES Users(id) ON DELETE CASCADE
);
    `) 
     console.log("TODO Schema Created !!");
     console.log(response1);
  } catch (error) {
    console.log("TODO Schema Not been Created !!");
  }
}


async function BalanceSchema() {
  try {
     const response1 = await PG_client.query(`
   CREATE TABLE Balance (
    id SERIAL PRIMARY KEY,
    userid INTEGER NOT NULL,
    balance NUMERIC NOT NULL,
    active BOOLEAN NOT NULL,
    FOREIGN KEY (userid) REFERENCES Users(id) ON DELETE CASCADE
);
    `) 
     console.log("Balance Schema Created !!");
     console.log(response1);
  } catch (error) {
    console.log("Balance Schema Not been Created !!");
  }
}

app.get('/',async(req,res)=>{
    await UserSchema();
    await BalanceSchema();
    await TODOSchema();
})

app.post('/signup',async(req,res)=>{
  const username  = req.body.username;
  const password = req.body.password;
  const email = req.body.email;

try {
   let response = await PG_client.query(`
       INSERT INTO Users (email,password,username)
       values ($1,$2,$3) RETURNING id;
    `,[email,password,username])

     const userid = response.rows[0].id;

    const token = jwt.sign({
      'userid' : userid
    },JWT_KEY);

    console.log(response);
    res.status(200).json({
      'message' : "Signup Successfully",
      'jwt' : token
    })
} catch (error) {
   console.log(error);
    res.status(400).json({
      'message' : "Signup Unsuccessfully"
    })  
}
})



app.post('/addtodo',async(req,res)=>{
  const task = req.body.task;
   const token = req.body.token;
   
   const {userid} = jwt.verify(token,JWT_KEY) as MYJWTinterface;
    
try {
   let response = await PG_client.query(`
       INSERT INTO Todos(userid,task)
       values ($1,$2);
    `,[userid,task])

    console.log(response);
    res.status(200).json({
      'message' : "Todo Added Successfully"
    })
} catch (error) {
  console.log(error);
    res.status(400).json({
      'message' : "Todo Added Unsuccessfully"
    })  
}
})

app.post('/openaccount',async(req,res)=>{
  const token = req.body.token;
   const {userid} = jwt.verify(token,JWT_KEY) as MYJWTinterface;

   try {
    const response = await PG_client.query(`
        Insert into Balance (userid,balance,active)
        values ($1,$2,$3);
      `,[userid,1000,true])
      console.log(response);
      res.status(200).json({
        "message" : "Account Created !!"
      })
   } catch (error) {
      res.status(400).json({
        "message" : "Account Not Created !!"
      })    
   }
})


app.post('/transaction',async(req,res)=>{
  const money  = req.body.money;
  const token = req.body.token;
  const username = req.body.username;
     const {userid} = jwt.verify(token,JWT_KEY) as MYJWTinterface;

  try {
     await PG_client.query(`BGEIN;`);
   let response = await PG_client.query(`
    Select id from Users where username = $1;
    `,[username])
    const friendid = response.rows[0].id;
    
    response = await PG_client.query(`
        Update Balance
        Set balance = balance - ${money}
        where id = $1;
      `,[userid])
    
      console.log(response);

    response = await PG_client.query(`
        Update Balance
        Set balance = balance + ${money}
        where username = $1;
      `,[userid])

  await PG_client.query(`COMMIT;`);

  res.status(200).json({
    'message' : "Money is added successfully"
  })
  } catch (error) {
    res.status(400).json({
      'message' : 'Failed Transaction'
    })
  }
})


app.post('/getdetails',async(req,res)=>{
  const token = req.body.token;
  const {userid} = jwt.verify(token,JWT_KEY) as MYJWTinterface;

  try {
    const response =await  PG_client.query(`
      Select *
      from Users as u
      full join balance as b
      on u.id = b.userid
      full join todos as t
      on u.id = t.userid
      where u.id = $1;
      `,[userid]);
      
      res.status(200).json({
        "message" : response.rows
      })
  } catch (error) {
    res.status(400).json({
      'Error' : error
    })
  }

})

app.listen(3000,()=>{
console.log("Listenning at 3000...")
})
