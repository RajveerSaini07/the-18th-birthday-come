(() => {
  const display=document.getElementById("codeDisplay"), feedback=document.getElementById("vaultFeedback");
  const reveal=document.getElementById("vaultReveal"), keypad=document.getElementById("keypad");
  let entered="";
  function render(){display.textContent=entered.padEnd(3,"·").split("").join(" ");}
  keypad.addEventListener("click",e=>{
    const key=e.target.closest("button")?.dataset.key;if(!key)return;
    if(key==="clear"){entered="";feedback.textContent="";render();return;}
    if(key==="enter"){
      if(entered===window.BIRTHDAY_CONFIG.secretCode){window.BIRTHDAY_VAULT_UNLOCKED=true;feedback.textContent="Unlocked! Your birthday wish is waiting in the next chapter. ✦";reveal.classList.add("show");keypad.style.opacity=".45";keypad.style.pointerEvents="none";display.textContent="✦ OPEN ✦";}
      else{feedback.textContent="Not quite. Try the year from the clue.";entered="";render();}
      return;
    }
    if(entered.length<3){entered+=key;render();}
  });
})();