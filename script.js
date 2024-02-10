//API Key - 48aa722f
//Example - http://www.omdbapi.com/?i=tt3896198&apikey=48aa722f

const key = '48aa722f';

var searchInput = document.getElementById('Input');
var displaySearchList = document.getElementsByClassName('fav-container');

fetch('http://www.omdbapi.com/?i=tt3896198&apikey=48aa722f')
    .then(res => res.json())
    .then(data => console.log(data));

// Upon keypress - function findMovies is initiated
searchInput.addEventListener('input', findMovies);


async function singleMovie() {
    // Finding ID of the movie from the URL
    var urlQueryParams = new URLSearchParams(window.location.search);
    var id = urlQueryParams.get('id')
    console.log(id);
    const url = `https://www.omdbapi.com/?i=${id}&apikey=${key}`
    const res = await fetch(`${url}`);
    const data = await res.json();
    console.log(data);
    console.log(url);

    // Making the output html by string interpolition
    var output = `

    <div class="movie-poster">
        <img src=${data.Poster} alt="Movie Poster">
    </div>
    <div class="movie-details">
        <div class="details-header">
            <div class="dh-ls">
                <h2>${data.Title}</h2>
            </div>
            <div class="dh-rs">
                <i class="fa-solid fa-bookmark" onClick=addTofavorites('${id}') style="cursor: pointer;"></i>
            </div>
        </div>
        <span class="italics-text"><i>${data.Year} &#x2022; ${data.Country} &#x2022; Rating - <span
                    style="font-size: 18px; font-weight: 600;">${data.imdbRating}</span>/10 </i></span>
        <ul class="details-ul">
            <li><strong>Actors: </strong>${data.Actors}</li>
            <li><strong>Director: </strong>${data.Director}</li>
            <li><strong>Writers: </strong>${data.Writer}</li>
        </ul>
        <ul class="details-ul">
            <li><strong>Genre: </strong>${data.Genre}</li>
            <li><strong>Release Date: </strong>${data.DVD}</li>
            <li><strong>Box Office: </strong>${data.BoxOffice}</li>
            <li><strong>Movie Runtime: </strong>${data.Runtime}</li>
        </ul>
        <p style="font-size: 14px; margin-top:10px;">${data.Plot}</p>
        <p style="font-size: 15px; font-style: italic; color: #222; margin-top: 10px;">
            <i class="fa-solid fa-award"></i>
            &thinsp; ${data.Awards}
        </p>
    </div> 
    `
    // Appending the output
    document.querySelector('.movie-container').innerHTML = output

}
//Displaying the movie list on the search page according to the user list
async function displayMovieList(movies) {
    var output = '';
    //Traversing over the movies list which is passed as an argument to our function
    for (i of movies) {

        var img = '';
        if (i.Poster != 'N/A') {
            img = i.Poster;
        }
        else {
            img = 'img/blank-poster.webp';
        }
        var id = i.imdbID;

        //Appending the output through string interpolition
        output += `

        <div class="fav-item">
            <div class="fav-poster">
            <a href="movie.html?id=${id}"><img src=${img} alt="Favourites Poster"></a>
            </div>
            <div class="fav-details">
                <div class="fav-details-box">
                    <div>
                        <p class="fav-movie-name"><a href="movie.html?id=${id}">${i.Title}</a></p>
                        <p class="fav-movie-rating"><a href="movie.html?id=${id}">${i.Year}</a></p>
                    </div>
                    <div>
                        <i class="fa-solid fa-bookmark" style="cursor:pointer;" onClick=addTofavorites('${id}')></i>
                    </div>
                </div>
            </div>
        </div>

       `
    }
    //Appending this to the movie-display class of our html page
    document.querySelector('.fav-container').innerHTML = output;
    console.log("here is movie list ..", movies);
}


//When the user is searching for the movie then a list of the related movie will be displayed and that list is fetched
async function findMovies() {
    const url = `https://www.omdbapi.com/?s=${(searchInput.value).trim()}&page=1&apikey=${key}`
    const res = await fetch(`${url}`);
    const data = await res.json();

    if (data.Search) {
        //Calling the function to display list of the movies related to the user search
        displayMovieList(data.Search)
    }
}

