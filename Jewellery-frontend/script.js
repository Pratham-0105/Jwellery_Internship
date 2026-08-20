function toggleMenu(){document.getElementById("mobileNav").classList.toggle("show")}
function closeMenu(){document.getElementById("mobileNav").classList.remove("show")}
function openConfigurator(){document.getElementById("configuratorModal").classList.add("show");document.body.style.overflow="hidden"}
function closeConfigurator(){document.getElementById("configuratorModal").classList.remove("show");document.body.style.overflow=""}
document.getElementById("configuratorModal").addEventListener("click",function(e){if(e.target===this)closeConfigurator()})
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeConfigurator()})
let selectedPrice=11900;
function selectSize(button,price){document.querySelectorAll(".size-option").forEach(x=>x.classList.remove("active"));button.classList.add("active");selectedPrice=price}
function setModalSize(button,size){document.querySelectorAll(".modal-sizes button").forEach(x=>{x.style.background="transparent";x.style.color="#171714"});button.style.background="#171714";button.style.color="#fff";const prices={"18 mm":11900,"20 mm":12700,"25 mm":15700,"30 mm":19400};selectedPrice=prices[size];document.getElementById("modalPrice").textContent="₹"+selectedPrice.toLocaleString("en-IN")}
function toggleFaq(button){const answer=button.parentElement.querySelector(".faq-answer");const icon=button.querySelector("strong");const open=answer.style.maxHeight;document.querySelectorAll(".faq-answer").forEach(x=>x.style.maxHeight=null);document.querySelectorAll(".faq-question strong").forEach(x=>x.textContent="+");if(!open){answer.style.maxHeight=answer.scrollHeight+"px";icon.textContent="−"}}
function continueConfigurator(){const engraving=document.getElementById("engraving").value;alert("Frontend configurator is ready. Location selection, 3D generation, backend and checkout can be connected next.")}
