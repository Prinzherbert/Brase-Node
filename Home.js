const home = document.getElementById("aHome");
const project = document.getElementById("aProject");
const about = document.getElementById("aAbout");
const support = document.getElementById("aSupport");
const divHome = document.getElementById("divHome");
const divProject = document.getElementById("divProject");
const divAbout = document.getElementById("divAbout");
const divSupport = document.getElementById("divSupport"); //Elementos

divProject.style.display = "none";
divAbout.style.display = "none";
divSupport.style.display = "none"; // Esconder elementos inicialmente

var currentPage = divHome; // Página atual

home.onclick = function(){
    currentPage.style.display = "none";
    currentPage = divHome;
    currentPage.style.display = "block"; // Esconder página atual e mostrar a desejada
}
project.onclick = function(){
    currentPage.style.display = "none";
    currentPage = divProject;
    currentPage.style.display = "block";
}
about.onclick = function(){
    currentPage.style.display = "none";
    currentPage = divAbout;
    currentPage.style.display = "block";
}
support.onclick = function(){
    currentPage.style.display = "none";
    currentPage = divSupport;
    currentPage.style.display = "block";
}