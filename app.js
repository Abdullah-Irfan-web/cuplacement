const express=require('express');
const app=express();
const path=require('path');
const bodyparser=require('body-parser');
const mongoose=require('mongoose');
const passport =require('passport');
const passportmongoose=require('passport-local-mongoose');
const LocalStrategy=require('passport-local').Strategy;
const session=require('express-session');
const bcrypt=require('bcryptjs');

const MongoStore = require('connect-mongo');

app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');
app.use(express.static('public'));
app.use(bodyparser.urlencoded({extended:true}));
app.use(express.json());


mongoose.connect('mongodb+srv://abdullah:abd123@cluster0.34stq.mongodb.net/CU_PLACEMENT?retryWrites=true&w=majority',{
    useNewUrlParser:true,
    useUnifiedTopology:true,
   
});

const db=mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {

    console.log("Connected");
});



let userschema=new mongoose.Schema({
    fname:{
        type:String,
        require:true
    },
    lname:{
        type:String,
        require:true
    },
    email:{
        type:String,
        require:true
    },
    uid:{
        type:String,
        require:true
    },
    password:{
        type:String,
        require:true
    },
    phone:{
        type:Number,
        require:true
    },
    dob:{
        type:String,
        require:true
    },
    role:{
        type:String,
        default:"student"
    }
})
let user=mongoose.model('User',userschema);


let companyschema=new mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    dod:{
        type:String,
        require:true
    },
    rounds:{
        type:String,
        require:true
    },
    cgpa:{
        type:Number,
        require:true
    },
    sem:{
        type:Number,
        require:true
    }
})
let studentschema=new mongoose.Schema({
    fname:{
        type:String,
        require:true
    },
    lname:{
        type:String,
        require:true
    },
    email:{
        type:String,
        require:true
    },
    uid:{
        type:String,
        require:true
    },
    phone:{
        type:Number,
        require:true

    },
    cgpa:{
        type:mongoose.Types.Decimal128,
        require:true
    },
    inter:{
        type:mongoose.Types.Decimal128,
        require:true
    },
    high:{
        type:mongoose.Types.Decimal128,
        require:true
    },
    sem:{
        type:Number,
        require:true
    }
})
let company=mongoose.model('Company',companyschema);
let student=mongoose.model('Student',studentschema);

passport.use(new LocalStrategy({usernameField:'uid'},(uid,password,done)=>{
    user.findOne({uid:uid})
    .then(userr=>{
        if(!userr){
            return done(null,false)
        }
        bcrypt.compare(password,userr.password,(err,isMatch)=>{
            if(isMatch){
                return done(null,userr)
            }
            else{
                return done(null,false)
            }
        })
    })
    .catch(err=>{
        console.log(err);
    })
}))

app.use(session({
    secret:"nodejs",
    resave:false,
    saveUninitialized:false,
    store: MongoStore.create({
        mongoUrl:'mongodb+srv://abdullah:abd123@cluster0.34stq.mongodb.net/CU_PLACEMENT?retryWrites=true&w=majority'
    })
    
    
}))

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.uid, username: user.fname+" "+user.lname,role:user.role });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

// const newuser=new user({
//     fname:"admin",
//     lname:"123",
//     email:"admin123@gmail.com",
//     password:"admin123",
//     uid:"E12345",
//     phone:"7007784133",
//     dob:"1990-10-15",
//     role:"admin"

// })
// bcrypt.genSalt(10,(err,salt)=>
// bcrypt.hash(newuser.password,salt,(err,hash)=>{
//     if(err)
//     throw err;
//     newuser.password=hash;
   
// newuser.save()
// }))
app.use(passport.initialize());
app.use(passport.session());

app.use((req,res,next)=>{
   
    res.locals.currentUser=req.user;
    next();
});

function ensureadminauthentication(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/adminlogin');
}
app.get('/',(req,res)=>{
    if(!req.user){
        return res.redirect('/login')
    }
    console.log(req.user)
    res.render('index')
})
app.get('/placed',(req,res)=>{
    
    res.render('Placed-Students');
})
app.get('/eligiblity',async(req,res)=>{
    if(!req.user){
        return res.redirect('/login')
    }
    let img=["images/12868721-c6162c9a.png","images/104093-b64f636a.png","images/250561-5adaef27.png","images/732082-e6931f26.png","images/5968594-84343c42.png","images/20837-323562e4.png","images/732096-13d9cafe.png","images/10832242-f1b2c258.png","images/5969096-de950306.png"]
    console.log(req.user)
let comdata=await company.find({});

let studata=await student.findOne({uid:req.user.id});
if(!studata){
   return  res.send("No data exits. Please wait while we add your data")
}
console.log(studata.cgpa)
const booleligible=[];
  for(let i=0 ;i<comdata.length;i++){
    booleligible.push(comdata[i].cgpa<studata.cgpa)
  }
console.log(booleligible);



    
    res.render('Eligibilty',{compdata:comdata,eligible:booleligible,image:img});
})

app.get('/signup',(req,res)=>{
    if(req.user){
        if(req.user==='admin'){
            return res.redirect('/admin')
        }
        return res.redirect('/')
    }
    res.render('Signup')
})
app.get('/deletecomp/:id',(req,res)=>{
    company.deleteOne({_id:req.params.id})
    .then(res.redirect('/admin'));
})
app.get('/preperation',(req,res)=>{
    res.render('Prepration')
})
app.get('/studentinfo',(req,res)=>{
    
    
    res.render('Student-Info')
})
app.post('/addstudentinfo',(req,res)=>{
    let data={
        fname:req.body.fname,
        lname:req.body.lname,
        email:req.body.email,
        phone:req.body.phone,
        sem:req.body.sem,
        high:req.body.high,
        inter:req.body.inter,
        uid:req.body.uid,
        cgpa:req.body.cgpa
    }
    console.log(req.body);
    student.create(data)
    .then(stu=>{
        res.redirect('/studentinfo');
    })
})
app.post('/signup',(req,res)=>{

      const{fname,lname,uid,password,phone,email,dob}=req.body;
      console.log(req.body)

      user.findOne({$or:[{uid:uid},{email:email}]})
      .then(userr=>{
          if(userr){
             
              return res.redirect('/signup')
          }

         
          const newuser=new user({
              fname:fname,
              lname:lname,
              email:email,
              password:password,
              uid:uid,
              phone:phone,
              dob:dob.toString()

          })
          bcrypt.genSalt(10,(err,salt)=>
          bcrypt.hash(newuser.password,salt,(err,hash)=>{
              if(err)
              throw err;
              newuser.password=hash;
             
          newuser.save()
          .then(userr=>{
            
              res.redirect('/login')
          })
          .catch(err=>{
              console.log(err);
          })
          })
          
          )


      })

})
app.get('/login',(req,res)=>{
    if(req.user){
        if(req.user.role==='admin'){
            return res.redirect('/admin')
        }
        else{
            return res.redirect('/')
        }
    }
    res.render('Login')
})
app.get('/adminlogin',(req,res)=>{

    
    res.render('Admin-Login')
})
app.get('/admin',(req,res)=>{
   console.log(req.user)
   
    company.find()
    .then(comp=>{
        console.log(comp)
        res.render('Admin-page',{comp:comp});
    })
   
})
app.get('/addcompany',ensureadminauthentication,(req,res)=>{
   
    res.render('company-info')
})

app.post('/addcompanydata',(req,res)=>{
    let{cname,dod,round,cgpa,sem}=req.body;
   console.log("kjdshdgh")
    console.log(req.body)
    let data={

    name:cname,
    dod:dod.toString(),
    rounds:round,
    cgpa:cgpa,
    sem:sem
    }
    company.create(data)
    .then(data=>{
        res.redirect('/admin')
    })
})
const geturl = (req) => {
    return req.user.role === 'admin' ? '/admin' : '/'
}
app.post('/login',
    passport.authenticate('local'),
    function(req, res) {
     
      res.redirect(geturl(req));
    });

    app.get('/logout',(req,res)=>{
        req.logout(function(err) {
            if (err) { return next(err); }
            res.redirect('/login');
          });
    })
    const port=process.env.PORT || 3000;
app.listen(3000,()=>{
    console.log("Started")
})