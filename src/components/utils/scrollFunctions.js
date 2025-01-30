export function onLastPage()
{   
         
         window.scrollTo({  
                top: document.documentElement.scrollHeight,
                behavior: "smooth",
     })  
    }
 
export function onFirstPage(){
window.scrollTo({
          top: 0,
          behavior: "smooth",
                });
}
export function onPageChange(onPage,pHeight){
    const scroll = (pHeight+32) * onPage
          window.scrollTo({
                
                top:scroll,
                behavior: "smooth",
            });
    }           
     