$(document).ready(function () {
  //console.log(firebase);

  //FIREBASE AUTHENTICATION
  const auth = firebase.auth();
  let currentUser;
  const provider = new firebase.auth.GoogleAuthProvider();


  //Buttons
  $("#login-btn").on("vclick",()=>{
    auth.signInWithPopup(provider);
  });
  $("#logout-btn").on("vclick",()=>{
    auth.signOut();
  });
  //Check if logged in on page load (only once)
  var hasCheckedOnPageLoad = false;
  auth.onAuthStateChanged(user=>{ //Show user logged in or ask him to log in
    if(!hasCheckedOnPageLoad){
      if(user){//if signed in
        //Show user info
        $(".user-info").html(`<span>${user.displayName.split(" ")[0]} ${user.displayName.split(" ")[1].substring(0,1)}.</span>`);
        //Show elements
        show($("#logout-btn"));
        $(".main-container").addClass("show");
        $(".main-container-login").css("--anim-delay","600ms");//If not loaded first, default delay
        $(".main-container").css("--anim-delay","3.2s");//If loaded first, long delay
      }else{//if not signed in

        $(".main-container-login").css("--anim-delay","3.2s");//If loaded first, long delay
        $(".main-container").css("--anim-delay","600ms")//If not loaded first, default delay
        $(".main-container-login").addClass("show");
      }
      setTimeout(()=>{hasCheckedOnPageLoad = true;},10);
    }
  });


  auth.onAuthStateChanged(user=>{ //Show user logged in or ask him to log in
    if(hasCheckedOnPageLoad){ //If not first load
      if(user){//if signed in
        //Show user info
        $(".user-info").html(`<span>${user.displayName.split(" ")[0]} ${user.displayName.split(" ")[1].substring(0,1)}.</span>`);
        //Reset animation delays
        $("#logout-btn").css("--anim-delay","600ms");
        $(".main-container-login").css("--anim-delay","600ms");
        $(".main-container").css("--anim-delay","600ms");
        //Hide and show elements
        show($("#logout-btn"));
        show($(".main-container"));
        hide($(".main-container-login"));

      }else{//if not signed in
        //Reset animation delays
        $(".main-container-login").css("--anim-delay","600ms");
        $(".main-container").css("--anim-delay","600ms");
        //Hide every tab
        hide($("#logout-btn"));
        hide($(".main-container"));
        hide($(".main-container-search"));
        hide($(".main-container-list"));
        hide($(".main-container-random"));
        //Show login page
        show($(".main-container-login"));
      }
    }
  });



  //FIRESTORE DATABASE
  const db = firebase.firestore();

  $("#list").on("vclick",()=>{ //Show recipe list
    //Reset first tab opened to left tab :
    $(".top").removeClass("active");
    $(".panels").removeClass("active");

    //Query my recipes from databse to HTML
    queryMyRecipes(db,currentUser.uid);
    queryFavoriteRecipes(db,currentUser.uid);
  });

  //MORE ACTIONS POPUP
  //Popup
  $("#more-actions-btn").on("vclick",()=>{
    $("#more-actions-popup").toggleClass("visible");
  });
  $(document).on("vclick",e=>{
    if(e.target.id != "more-actions-popup" && e.target.id !="more-actions-btn"//If you click outside
    && $("#more-actions-popup").hasClass("visible")){//But the popup is already shown
      e.preventDefault();
      $("#more-actions-popup").removeClass("visible");//Hide popup when clicking outside
    }
  });
  $("body").scroll(()=>{
    $("#more-actions-popup").removeClass("visible");//Hide popup when clicking outside
  })
  //Popup btns
  $("#delete").on("vclick",()=>{
    deleteRecipes(db,currentUser.uid,$(".recipe-item.selected"));

    hideActionsPopup();
    selectingRecipes = false;
  });
  $("#more-actions-popup").on("vclick", "#add-favorites", ()=>{//using "on" event to handle click on appended elements
    addRecipesToFavorites(db,currentUser.uid,$(".recipe-item.selected"));

    hideActionsPopup();
    selectingRecipes = false;
  });
  $("#more-actions-popup").on("vclick", "#remove-favorites", ()=>{
    removeRecipesFromFavorites(db,currentUser.uid,$(".recipe-item.selected"));

    hideActionsPopup();
    selectingRecipes = false;
  });
  $("#add-btn").on("vclick",()=>{
    if($("#more-actions-popup").hasClass("visible") == false){//If popup is not visible
      loadAddRecipePage();
    }
  });


  auth.onAuthStateChanged(user=>{
    if(user){//if signed in
      currentUser = user;

      $("#log-out").on("vclick",()=>{
        auth.signOut();

        hideActionsPopup();
        selectingRecipes = false;
      });
    }else{
      currentUser = null;
      $("#add-btn").on("vclick",()=>{
        console.log("Error - User not signed in");
      });
    }
  });






  //MAIN BUTTONS
  $("#search").on("vclick",()=>{ //Show serach bar + filters
    hide($(".main-container"));
    show($(".main-container-search"));
  });
  $("#list").on("vclick",()=>{ //Show list
    hide($(".main-container"));
    show($(".main-container-list"));
  });
  $("#random").on("vclick",()=>{ //Show random btns
    hide($(".main-container"));
    show($(".main-container-random"));
  });


  //SEARCH
  $("#search-btn").on("vclick",()=>{
    value = $("#search-input").val();
    if(value){
      $(".main-container-search .input-container p").css("opacity",0);
      loadRecipePage(null,value);
    }else{
      $(".main-container-search .input-container p").css("opacity",1);
      setTimeout(()=>{
        $(".main-container-search .input-container p").css("opacity",0);
      },5000);
    }
  });
  $("#search-back-btn").on("vclick",()=>{
    //Hide search btns
    hide($(".main-container-search"));
    //Show main btns
    showMainBtns();
  });

  //MY RECIPES
  //Top tab buttons
  $("#my-recipes-btn").on("vclick",()=>{
    //Switch to left tab
    $(".top").removeClass("active");
    $(".panels").removeClass("active");

    selectingRecipes = false;//Stop selecting recipes
    hideActionsPopup();
    $("#more-actions-popup ul li:nth-child(2)").replaceWith('<li id="add-favorites">Ajouter aux favoris</li>');
  });
  $("#favorites-btn").on("vclick",()=>{
    if($("#more-actions-popup").hasClass("visible") == false){//If popup is not visible
      //Switch to right tab
      $(".top").addClass("active");
      $(".panels").addClass("active");

      selectingRecipes = false;//Stop selecting recipes
      hideActionsPopup();
      $("#more-actions-popup ul li:nth-child(2)").replaceWith('<li id="remove-favorites">Retirer des favoris</li>');
    }
  });
  $("#list-back-btn").on("vclick",()=>{
    if($("#more-actions-popup").hasClass("visible") == false){//If popup is not visible
      //Hide list
      hide($(".main-container-list"));
      //Show main btns
      showMainBtns();
    }
  });

  //Trigger on list element hold
  var held = false;
  var selectingRecipes = false;

  //List items
  $.event.special.tap.tapholdThreshold = 300;
  $('.recipe-list').on('taphold','.recipe-item',event=>{//taphold from jquery mobile
    if(selectingRecipes == false){
      held = true;
      selectingRecipes = true;//Allow the selection

      $('.checkbox').addClass("visible");
      $("#more-actions-btn").addClass("visible");

      //Add first item to the selection
      //console.log("Add to selection first");
      addRecipeToSelection($(event.currentTarget));
    }

  });
  $('.recipe-list').on('vmouseup', '.recipe-item', event=>{//"Click" event, refers to mouseup and touchend
    if($("#more-actions-popup").hasClass("visible") == false){//If popup is not visible
      if(selectingRecipes && !held){//If selecting (and prevent from happening at the same time as taphold)
        if($(event.currentTarget).hasClass("selected")){
          //If already selected, deselect it
          removeRecipeFromSelection($(event.currentTarget));

          //Stop selecting if no element selected
          if($(".recipe-item.selected").length == 0){
            selectingRecipes = false;
            $('.checkbox').removeClass("visible");
            $('#more-actions-btn').removeClass("visible");
          }
        }else{
          //If not selected, select it
          //console.log("Add to selection");
          addRecipeToSelection($(event.currentTarget));
        }
      }else if(!selectingRecipes && !held){//If not selecting (and not tapheld), load recipe
        console.log("Load recipe clicked");
        var id = event.currentTarget.dataset.id; //Get the data-id element in HTML
        ////COMMENTED FOR DEBUG
        loadRecipePage(null,null,id);
      }
      held = false;//Reset
    }

  });


  //RANDOM
  $("#entree").on("vclick",()=>{
    loadRecipePage("entree");
  });
  $("#plate").on("vclick",()=>{
    loadRecipePage("plate");
  });
  $("#dessert").on("vclick",()=>{
    loadRecipePage("dessert");
  });
  $("#random-back-btn").on("vclick",()=>{
    //Hide search btns
    hide($(".main-container-random"));
    //Show main btns
    showMainBtns();
  });
});

//UI
function showMainBtns(){
  $(".main-container").css("--anim-delay","600ms");
  show($(".main-container"));
}
function show(container){
  container.css("display","flex");
  container.addClass("show");
  container.removeClass("hide");
}
function hide(container){
  if(container.hasClass("show") || (container == $(".main-container") && !container.hasClass("show"))){
    container.addClass("hide");
    container.removeClass("show");
    var transitionDuration = 700;
    setTimeout(()=>{
      container.css("display","none");
    },transitionDuration);
  }
}

//Add recipe
function loadAddRecipePage(){
  //Prevent user from logging out when loading
  $("#logout-btn").css("pointer-events","none");
  //Hide active menu
  hide($(".show"));
  $(".header").css("animation","hideBgEnd 1.5s ease-in-out forwards");
  //Load page after animations
  setTimeout(()=>{
    window.location.href = "add-recipe.html";
  },1500);
}

//Load recipe
function loadRecipePage(type,searchValue,id){
  //Prevent user from logging out when loading
  $("#logout-btn").css("pointer-events","none");
  //Hide active menu
  hide($(".show"));
  //Make the overlay + BG fade out
  show($(".overlay"));
  $(".header").css("animation","hideBgEnd 1.5s ease-in-out forwards");
  //Pass the params to the recipes page
  var query = "";

  if(type) query += "#type=" + type;
  if(searchValue) query += "#search=" + searchValue;
  if(id) query += "#id=" + id;
  //Load page after animations
  setTimeout(()=>{
    window.location.href = "recipes.html" + query;
  },1500);
}



//QUERY MY RECIPES
function queryMyRecipes(db, userID){
  var appendParent = $(".my-panel .recipe-list");
  appendParent.html("<p>Aucune recette trouvée.</p>");//Remove already existing items
  //console.log("My Recipes Reset");

  let recipesRef = db.collection("recipes");

  recipesRef.where("uid","==", userID).orderBy("title", "asc").get()
    .then((querySnapshot)=>{
      processQuerySnapshot(querySnapshot, appendParent);
    })
    .catch((error)=>{
      console.log("Type Request - Error : " + error);
      appendParent.html("<p>Aucune recette trouvée.</p>");//Remove already existing items
    });

}
function queryFavoriteRecipes(db, userID){
  var appendParent = $(".favorites-panel .recipe-list");
  appendParent.html("<p>Aucune recette trouvée.</p>");//Remove already existing items by default
  //console.log("Favorite Reset");

  let usersRef = db.collection("users");
  let recipesRef = db.collection("recipes");

  var recipes = [];
  //Search what recipe ID are in the favorites of the user and query them
  usersRef.doc(userID).get()//Get the user doc
    .then(userDoc=>{

      var recipeIds = userDoc.data().favorites.map(element=>{
        return element +"";//convert to string
      })
      //console.log(recipeIds);

      //recipesRef.doc(recipeID).get() returns a Promise
      var recipesDocs = recipeIds.map(recipeID=>{
        return recipesRef.doc(recipeID).get();
      });

      Promise.all(recipesDocs)//Waiting for every promise in the array to resolve
        .then(docs=>{
          recipes = docs.map(doc=>{
            return {
              id: doc.id,
              data: doc.data()
            };
          });

          //Append all elements
          appendRecipes(recipes,appendParent);
        });
    })
    .catch((error)=>{
      console.log("User/Recipe not in DB - " + error);
      appendParent.html("<p>Aucune recette trouvée.</p>");//Remove already existing items
    });
}

function processQuerySnapshot (querySnapshot,appendParent){
  var docs = [];
  querySnapshot.forEach((doc) => {
    docs.push({
      id : doc.id,//Recipe unique ID
      data : doc.data()//Recipe data
    });
  });

  appendRecipes(docs,appendParent);
}

function appendRecipes(recipes,appendParent){
  if(recipes.length>0){
    //console.log("append recipes");

    recipes = jQuery.map(recipes,(element)=>{//Replace each doc by the corresponding list item html element
      let defaultImgUrl;
      //Set the default img in case there is no imgUrl
      switch(element.data.type){
        case "entree" : defaultImgUrl = "img/entree.svg"; break;
        case "plate"  : defaultImgUrl = "img/plate.svg";  break;
        case "dessert": defaultImgUrl = "img/dessert.svg";break;
      }
      //defaultImgUrl = "img/bg-top0.svg";

      return `<li class="recipe-item" data-id="${element.id}">
                <img class="recipeImg" ${element.data.imgName ? `data-img-name="${element.data.imgName}"` : ""} src=${element.data.imgUrl ? element.data.imgUrl : defaultImgUrl} alt="">
                <div class="content">
                  <div class="titles">
                    <h4>${element.data.title}${element.data.subtitle ? ` <span>${element.data.subtitle}</span>` : ""}</h4>
                  </div>
                  <div class="desc">
                    <ul>
                      <li id=time>
                        <img src="img/time-dark.svg" alt="">
                        <span>${element.data.preparationTime}</span>
                      </li>
                      <li id="difficulty">
                        <img src="img/difficulty-dark.svg" alt="">
                        <span>${element.data.difficulty}</span>
                      </li>
                      <li id="number-of-people">
                        <img src="img/nb-people-many-dark.svg" alt="">
                        <span>${element.data.nbPeople} Pers.</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <img class="checkbox" src="img/checkbox-inside.svg" alt="">
              </li>`;
    });
    appendParent.html(recipes.join("")); //Join array to append all list items at the same time (not using append to overwrite already existing items)
  }else{
    appendParent.html("<p>Aucune recette trouvée.</p>"); //Remove already existing items
  }

}

//Recipe selection
function addRecipeToSelection(recipe){
  recipe.addClass("selected");
}
function removeRecipeFromSelection(recipe){
  recipe.removeClass("selected");
}

//MORE OPTIONS POPUP
function deleteRecipes(db,userID,recipes){
  let recipesRef = db.collection("recipes");
  let query;

  recipes.each((i,recipe)=>{
    //Remove from recipe database
    var recipeId = $(recipe).data("id");
    var recipeImg = $(recipe).children(".recipeImg").eq(0);
    var recipeImgName = recipeImg.data("img-name") ? recipeImg.data("img-name") : null;

    recipesRef.doc(recipeId).delete()//Remove from DB
      .then(()=>{
        console.log("Recipe removed from DB, ID=" + recipeId);
        //On success, remove HTML
        var myRecipeHTML = $(".my-panel .recipe-list .recipe-item").filter(i=>{
          return $(".my-panel .recipe-list .recipe-item")[i].dataset.id === recipeId;//Get all recipe <li>s that have the right ID dataR
        })
        var favRecipeHtml = $(".favorites-panel .recipe-list .recipe-item").filter(i=>{
          return $(".favorites-panel .recipe-list .recipe-item")[i].dataset.id === recipeId;//Get all recipe <li>s that have the right ID data
        })
        //Remove HTML from both panels
        removeRecipeFromHTML(myRecipeHTML);
        removeRecipeFromHTML(favRecipeHtml);
        //Remove img from storage
        removeImgFromStorage(db,userID,recipeImgName)
      })
      .catch(error=>{
        console.log("Recipe not removed from DB, ID=" + recipeId + " - Error : "+error);
      });

  });
  removeRecipesFromFavorites(db,userID,recipes);
}
function addRecipesToFavorites(db,userID,recipes){
  let usersRef = db.collection("users");

  db.collection('users').doc(userID).get()
    .then((docSnapshot) => {
      if(docSnapshot.exists == false){//If not already existing, create the document
        //console.log("Document doesn't exist yet, creating it.");
        usersRef.doc(userID).set({
          favorites: [] //Create doc
        });
      }
    })

  recipes.each((i,recipe)=>{
    var recipeId = $(recipe).data("id");

    //Add to favorite database
    db.collection('users').doc(userID).get()
      .then((docSnapshot) => {
        //Add to the database
        usersRef.doc(userID).update({//Update the doc with the id=userID
          favorites: firebase.firestore.FieldValue.arrayUnion(recipeId)//Add the recipe ID to the "favorites" array field
        });


        //Add to the favorites panel list if success
        $(".favorites-panel .recipe-list").children("p").remove();//Remove empty list paragraph

        var favoritesIDs = $.map( $(".favorites-panel .recipe-item"),item=>{
          return $(item).data("id"); //Get all IDs in favorites list
        });

        if( $.inArray($(recipe).data("id"), favoritesIDs) == -1 ){//If ID not already in favorites list, append it
          console.log("Recipe added to favorites DB, ID=" + recipeId);

          var recipeClone = $(recipe).clone().removeClass("selected").removeClass("visible");
          recipeClone.appendTo($(".favorites-panel .recipe-list"));
        }

      })
      .catch(error=>{
        console.log("Couldn't add favorite - " + error);
      });
  });
}
function removeRecipesFromFavorites(db,userID,recipes){
  let usersRef = db.collection("users");

  recipes.each((i,recipe)=>{
    var recipeId = $(recipe).data("id");

    //Remove from favorite database
    usersRef.doc(userID).update({//Update the doc with the id=userID
        favorites: firebase.firestore.FieldValue.arrayRemove(recipeId)//Remove the recipe ID from the "favorites" array field.
    })
    .then(()=>{
      console.log("Recipe removed from favorites DB, ID=" + recipeId);
      removeRecipeFromHTML(recipe);
    });


  });
}

function removeImgFromStorage(db,userID,imgName){
  var imageRef = firebase.storage().ref('recipe-imgs/' + imgName);

  if(imgName){//If in storage
    imageRef.delete()//Delete it
      .then(()=>{
        console.log("Recipe img successfully deleted from storage")
      })
      .catch(error => {//Didn't exist /error
        console.log("Couldn't delete img from storage - " + error)
      })
  }
}




function removeRecipeFromHTML(recipe){
  //Remove actual HTML element
  $(recipe).css("animation","buttonPopOut 600ms ease-in-out forwards");

  $(recipe).fadeOut(600,function(){//call the function at the end of the fadeout
      $(recipe).css({"visibility":"hidden",display:'block'}).slideUp(600);//Hide element and slide others up for 600ms
  });
  setTimeout(()=>{
    var recipeList = $(recipe).parent().parent().children(".recipe-list");
    if(recipeList.children(".recipe-item").length == 1){//If it was the last element in the .recipe-list
      recipeList.append("<p>Aucune recette trouvée.</p>");//Append it
      recipeList.children(">p").css("animation-delay","0s");//remove anim delay
    }
    //Remove the HTML element
    $(recipe).remove();
  },600+600);
}



function hideActionsPopup(){
  $("#more-actions-popup").removeClass("visible");//Hide popup
  $(".checkbox").removeClass("visible");//Hide checkboxes
  $("#more-actions-btn").removeClass("visible");//Hide more actions btn
  $(".recipe-item.selected").removeClass("selected");//Deselect items
}
