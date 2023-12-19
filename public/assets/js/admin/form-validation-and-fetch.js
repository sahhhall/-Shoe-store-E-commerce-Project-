////////////////////////////////////   otp verificarion page   ///////////////////////////////////////////////////////////


function validate() {
    let fields = document.querySelectorAll(".form-control");
    let isValid = true;

    fields.forEach(function (field) {
        if (field.value.trim() === "" || field.value.length>1) {
            field.style.border = 'solid 1px red';

            setTimeout(function () {
                field.style.border = '';
            }, 3000);

            isValid = false;
        }
    });

    return isValid;
}


// color changing 
function resend(){
  const change =  document.getElementById('resend');
  change.style.color='green';
  setTimeout(()=>{
    change.style.color='';
  },1000)
}


//for timer expiriing in otp timer

let countdownInterval;
function startCountdown(initialValue) {
    let n = initialValue;
    countdownInterval = setInterval(() => {
        if (n === 0) {
            clearInterval(countdownInterval);
        }
        document.querySelector('.time').innerHTML = n;
        n = n - 1;
    }, 1000);
}

function resend() {
    clearInterval(countdownInterval); 
    startCountdown(60); 
}
startCountdown(60); 

document.getElementById("resend").onclick = function () {
    resend();
};


//  fetch api for send resend 
  
document.getElementById('resend').addEventListener('click', () => {
try {
    const currentUrl = window.location.href;

    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get("email");

   
    const postUrl = "/resend" + (email ? `?email=${encodeURIComponent(email)}` : "");

    fetch(postUrl, {
        method: "POST"
    })
    .then(response => {
        if (response.ok) {
            console.log("Resend request successful");
        } else {    
            console.error("Resend request failed");
        }
    })
    .catch(error => {
        console.error("Error:", error);
    });
} catch (error) {
    console.error("Error:", error);
}
});


/////////////////////////////////////////////////// reset password page /////////////////////////////////////////////////////

function validate(){

    let password = document.getElementById('new-password');
    let passwordconf = document.getElementById('confirm-password')
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/.test(password.value)){
        password.style.border = 'solid 1px red';
        passwordError.textContent = "Password must be atleast 6 charcaters long and contain at least one uppercase letter one lowercase letter,and one number";
        setTimeout(function () {
          password.style.border = '';
          passwordError.textContent = '';
      }, 5000);
        return false;
     }
  
      else if( password.value !== passwordconf.value ){
          passwordconf.style.border = 'solid 1px red';
          passwordError2.textContent = "Password should be same";
          setTimeout(function () {
          passwordconf.style.border = '';
          passwordError2.textContent = '';
      }, 3000);
          return false
  
      }
      else{
           
          true;
      }}




//////////////////////////////////////////////////// signuppage  ///////////////////////////////////////////////////////////


function validate(){
    let username = document.getElementById("uname");
    let password = document.getElementById("pass");
    let passwordconf = document.getElementById("confpass");
    let userphone = document.getElementById("uphone");
    
    
    if( !/^\w+$/.test(username.value) ){
    username.style.border = 'solid 1px red'    
    userError.textContent = "only allow letters numbers and underscores"
    setTimeout(function () {
        username.style.border = '';
        userError.textContent = '';
    }, 3000); 
   
    return false;
    }
    else if (userphone.value.trim().length < 10 || !/^\d+$/.test(userphone.value)) {
        
    userphone.style.border = 'solid 1px red';
    phoneErr.textContent = "Mobile number should be an Number with  10 digits";
    setTimeout(function () {
        userphone.style.border = '';
        phoneErr.textContent = '';
    }, 3000);
    return false;
}



   else if (  !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/.test(password.value) ) {
      password.style.border = 'solid 1px red';
      passwordError.textContent = "Password must be atleast 6 charcaters long and contain at least one uppercase letter one lowercase letter,and one number";
      setTimeout(function () {
        password.style.border = '';
        passwordError.textContent = '';
    }, 6000);
      return false;
   }

    else if( password.value !== passwordconf.value ){
        passwordconf.style.border = 'solid 1px red';
        passwordError2.textContent = "Password should be same";
        setTimeout(function () {
        passwordconf.style.border = '';
        passwordError2.textContent = '';
    }, 3000);
        return false

    }
    else{
         
        true;
    }
}

let existAlert = document.getElementById('existAlert');
let usernameExistAlert = document.getElementById('usernameExistAlert');
setTimeout(function () {
    
    if (existAlert) {
      existAlert.style.display = 'none';
    }
  }, 3000);

  setTimeout(function () {
   
    if (usernameExistAlert) {
      usernameExistAlert.style.display = 'none';
    }
  }, 3000);



