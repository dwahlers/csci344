// Maximize: shift + ⌘ + [
// Minimize: shift + ⌘ + ]

/********************/
/* Global Variables */
/********************/
const rootURL = 'https://photo-app-secured.herokuapp.com';
let token; 
var activeElement;

/******************/
/* Your Functions */
/******************/
const showStories = async () => {
    const endpoint = `${rootURL}/api/stories`;
    const response = await fetch(endpoint, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    })
    const data = await response.json();
    console.log(data);
    const htmlChunk = data.map(storyToHtml).join('');
    document.querySelector('#stories').innerHTML = htmlChunk;
}

const closeModal = () =>{
    activeElement.focus();
    document.getElementById("modal-bg").className = "modal-bg hidden";
    document.getElementById("modal-bg").ariaHidden = "true";
    document.getElementById("main").ariaHidden = "false";
    document.getElementById("aside").ariaHidden = "false";
}

const storyToHtml = story => {
    return `<section class="story">
        <img src="${story.user.thumb_url}" />
        <p>${story.user.username}</p>
    </section>
    `
}

const showPosts = async () => {
    // 1. go out to the internet and grab our posts
    // 2. save the resulting data to a variable
    // 3. transform the data into an HTML represention
    // 4. display it:
    const endpoint = `${rootURL}/api/posts`;
    const response = await fetch(endpoint, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    })
    const data = await response.json();
    console.log('Posts:', data);

    const arrayOfHTML = data.map(postToHTML);
    const htmlString = arrayOfHTML.join('');
    document.querySelector('#posts').innerHTML = htmlString;
}

const showProfile = async () =>{
    const endpoint = `${rootURL}/api/profile`;
    const response = await fetch(endpoint, {
        headers: {
            'Content-Type': 'application/json',
            "Authorization": "Bearer " + token
        }
    })
    const data = await response.json();
    console.log('Profile:', data);

    const htmlString = profileToHTML(data);
    const htmlUsername = usernameToHTML(data);
    document.querySelector('.inner-flexbar').insertAdjacentHTML("afterbegin", htmlUsername);
    document.querySelector('#user-profile').innerHTML = htmlString;
}

const usernameToHTML = profile =>{
    return`
    <p>${profile.username}</p>`;
}

const showSuggestions = async () =>{
    const endpoint = `${rootURL}/api/suggestions/`;
    const response = await fetch(endpoint,{
        headers:{
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    })

    const data = await response.json();
    console.log('Suggestions:',data);

    const htmlString = data.map(suggestionsToHTML).join('');
    document.querySelector('#suggestions').innerHTML = htmlString;
}

const suggestionsToHTML = suggestion =>{
    return`
    <section class="suggestion">
        <img src="${suggestion.thumb_url}"/>
        <div>
            <p>${suggestion.username}</p>
            <p class="suggest-text">Suggested For You</p>
        </div>
        <button id="follow${suggestion.id}" aria-label="follow this user" onclick="followAccount(${suggestion.id})">follow</button>
    </section>`
}



const getLikeButton = post =>{
    if(post.current_user_like_id == undefined){
        return `
        <button aria-label="like button - unliked" onclick="likePost(${post.id})">
            <i class="fa-regular fa-heart"></i>
        </button>`;
    }
    else{
        return `
        <button aria-label="like button - liked" onclick="unlikePost(${post.current_user_like_id}, ${post.id})">
            <i class="fa-solid fa-heart"></i>
        </button>`
    }
}

const getLikeCount = post =>{
    if(post.likes.length == 1){
        return`
        <p>${post.likes.length} like</p>`;
    }
    else {
        return`
        <p>${post.likes.length} likes</p>`;
    }
}

const comment = async(postId) =>{
    const comment = document.querySelector(`#comment${postId}`).value;
    const endpoint = `${rootURL}/api/comments`;
    const commentData = {
        'post_id': postId,
        'text': comment
    };
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(commentData)
    })
    const data = await response.json()
    console.log(data);
    await requeryRedraw(postId);
    document.getElementById(`comment${postId}`).focus();
}

const followAccount = async(suggestionId) =>{
    const endpoint = `${rootURL}/api/following/`;
    const suggestionData = {
        'user_id': suggestionId
    }

    // Create the bookmark:
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(suggestionData)
    })
    const data = await response.json();
    console.log('following:', data);

    //requeryRedraw(suggestionId);
    document.querySelector(`#follow${suggestionId}`).innerHTML= `unfollow`;
    document.querySelector(`#follow${suggestionId}`).setAttribute("onClick", `unfollow(${data.id}, ${suggestionId})`);

}

const unfollow = async(followId, suggestionId) =>{
    const endpoint = `${rootURL}/api/following/${followId}`;
    const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    })
    const data = await response.json();
    console.log(data);

    document.querySelector(`#follow${suggestionId}`).innerHTML= `follow`;
    document.querySelector(`#follow${suggestionId}`).setAttribute("onClick", `followAccount(${suggestionId})`);
}

const unlikePost = async (likeId, postId) =>{
    const endpoint = `${rootURL}/api/posts/likes/${likeId}`;

    // Create the bookmark:
    const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    })
    const data = await response.json();
    console.log(data);
    requeryRedraw(postId);
}

const likePost = async (postId) =>{
    const endpoint = `${rootURL}/api/posts/likes/`;
    const postData = {
        "post_id": postId
    };

    // Create the bookmark:
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(postData)
    })
    const data = await response.json();
    console.log('likes:', data);
    requeryRedraw(postId);
}




const getBookmarkButton = post => {
    if(post.current_user_bookmark_id == undefined){
        return `
        <button aria-label:"bookmark button - unbookmarked" onclick="bookmarkPost(${post.id})"
        >
            <i class="fa-regular fa-bookmark"></i>
        </button>`;
    }
    return `
    <button aria-label:"bookmark button - bookmarked" onclick="unbookmarkPost(${post.current_user_bookmark_id}, ${post.id})"
    >
        <i class="fa-solid fa-bookmark"></i>
    </button>`;
}

const requeryRedraw = async (postId) => {
    const endpoint = `${rootURL}/api/posts/${postId}`;
    const response = await fetch(endpoint, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    })
    const data = await response.json();
    console.log(data);
    const htmlString = postToHTML(data);
    targetElementAndReplace(`#post_${postId}`, htmlString);
}

const bookmarkPost = async (postId) => {
    // define the endpoint:
    const endpoint = `${rootURL}/api/bookmarks/`;
    const postData = {
        "post_id": postId
    };

    // Create the bookmark:
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(postData)
    })
    const data = await response.json();
    console.log(data);
    requeryRedraw(postId);
}

const unbookmarkPost = async (bookmarkId, postId) => {
    // define the endpoint:
    const endpoint = `${rootURL}/api/bookmarks/${bookmarkId}`;

    // Create the bookmark:
    const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    })
    const data = await response.json();
    console.log(data);
    requeryRedraw(postId);
}

const modalToHTML = post =>{
    return `
        <div>
            <img src="${post.image_url}"/>
            <div id="right-side">
                <div id="top-modal">
                    <img id="user-img" src="${post.user.thumb_url}"/>
                    <p id="username">${post.user.username}</p>
                </div>
                <div class="comments">
                    ${getAllComments(post)}
                </div>
            </div>
        </div>`;
    document.querySelector(".modal-body").innerHTML = stringHTML;
}

const getAllComments = post =>{
    let stringHTML = ``;
    for(let i = post.comments.length -1; i >= 0; i--){
        stringHTML += `
        <div class="comment">
        <img class="comment-img" src="${post.comments[i].user.thumb_url}">
        <p><strong>${post.comments[i].user.username}</strong> 
        ${post.comments[i].text} <br>
        <font size="-1">${post.comments[i].display_time}</font></p>
        <button aria-label="like button - unliked">
            <i class="fa-regular fa-heart"></i>
        </button>
        </div>`;
    }
    return stringHTML;
}

const postToHTML = post => {
    // console.log(post.comments.length);
    return `
        <section id="post_${post.id}" class="post">
            <p class="post-username">${post.user.username}<p>
            <img src="${post.image_url}" alt="Fake image" />
            <section class="flexbar">
                <div class="inner-flexbar">
                    ${getLikeButton(post)}
                    <button aria-label="Comment button">
                        <i class="fa-regular fa-comment"></i>
                    </button>
                    <button aria-label="Send button">
                        <i class="fa-regular fa-paper-plane"></i>
                    </button>
                </div>
                ${getBookmarkButton(post)}
            </section>
            <section class="lowerpost">
                ${getLikeCount(post)}
                <p>${post.caption}</p>
                ${ showCommentAndButtonIfItMakesSense(post)}
            </section>
            <hr>
            <div class="flexbar">
                <form aria-label="comment text-box" class="comment-box" action="#">
                    <input type="text" name="comment" id="comment${post.id}" placeholder="Add a Comment...">
                </form> 
                <button aria-label="post button" class="post-button" onclick="comment(${post.id})">Post</button>
            </div>
        </section>
    `
}

const profileToHTML = profile =>{
    return`
    <section id="profile">
        <img id="profile-pic" src="${profile.image_url}"/>
        <p>${profile.username}</p>
    </section>
    <p id="for-you">Suggestions For You</p>`;
}

showModal = async(postId) => {
    activeElement = document.activeElement;
    const endpoint = `${rootURL}/api/posts/${postId}/`;
    const response = await fetch(endpoint, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
            "Authorization": "Bearer " + token
        }
    })
    const data = await response.json();
    console.log('Post:', data);
    const stringHTML = modalToHTML(data);

    document.getElementById("modal-bg").className = "modal-bg";
    document.getElementById("modal-bg").ariaHidden = "false";
    document.getElementById("main").ariaHidden = "true";
    document.getElementById("aside").ariaHidden = "true";

    document.querySelector(".modal-body").innerHTML = stringHTML;

    document.getElementById("close").focus();

}

const showCommentAndButtonIfItMakesSense = post => {
    const hasComments = post.comments.length > 0;
    const lastCommentIndex = post.comments.length - 1;
    if (hasComments) {
        return `<div>
            <button class="modal-button" onclick="showModal(${post.id})">View all ${post.comments.length} comments</button>
            <p>${post.comments[lastCommentIndex].text}</p>
            <p class="time">${post.comments[lastCommentIndex].display_time}</p>
        </div>`;
    } else {
        return '';
    } 
}


const initPage = async () => {
    // set the token as a global variable 
    // (so that all of your other functions can access it):
    token = await getAccessToken(rootURL, 'daniel', 'daniel_password');
    console.log(token);
    
    // then use the access token provided to access data on the user's behalf
    showProfile()
    showStories();
    showPosts();
    showSuggestions();

    // query for the user's profile
    // query for suggestions
}


/********************/
/* Helper Functions */
/********************/

// helper function for logging into the website:
const getAccessToken = async (rootURL, username, password) => {
    const postData = {
        "username": username,
        "password": password
    };
    const endpoint = `${rootURL}/api/token/`;
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
    });
    const data = await response.json();
    return data.access_token;
}

const postComment = async(comment_id, post_id) =>{
    const comment = document.querySelector(`#${comment_id}`).value;
    console.log(comment);
    const endpoint = `${rootURL}/api/comments/`;
    const commentData = {
        "post_id": post_id,
        "text": comment
    };
    const response = await fetch(endpoint,{
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(commentData)
    })
    const data = await response.json();
    requeryRedraw(post_id);
}

/**
 * Helper function to replace a DOM element.
 * https://developer.mozilla.org/en-US/docs/Web/API/Node/replaceChild
 * 
 *  Arguments: 
 *     1. selector: the selector you want to target (string)
 *     2. newHTML:  the HTML you want to replace
 */
const targetElementAndReplace = (selector, newHTML) => { 
	const div = document.createElement('div'); 
	div.innerHTML = newHTML;
	const newEl = div.firstElementChild; 
    const oldEl = document.querySelector(selector);
    oldEl.parentElement.replaceChild(newEl, oldEl);
}


/******************************************/
/* Invoke initPage to kick everything off */
/******************************************/
initPage();