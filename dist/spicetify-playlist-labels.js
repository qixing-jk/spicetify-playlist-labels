!async function(){for(;!Spicetify.React||!Spicetify.ReactDOM;)await new Promise(e=>setTimeout(e,10));var o,s,c,p,u,d,e,t,i,f,m,y,v,l,a,r,g,b,h,n,w,S,x;o=Object.create,s=Object.defineProperty,c=Object.getOwnPropertyDescriptor,p=Object.getOwnPropertyNames,u=Object.getPrototypeOf,d=Object.prototype.hasOwnProperty,i=(e=(e,t)=>function(){return t||(0,e[p(e)[0]])((t={exports:{}}).exports,t),t.exports})({"external-global-plugin:react-dom"(e,t){t.exports=Spicetify.ReactDOM}}),f=(t=(e,t,i)=>{i=null!=e?o(u(e)):{};var l=!t&&e&&e.__esModule?i:s(i,"default",{value:e,enumerable:!0}),a=e,r=void 0,n=void 0;if(a&&"object"==typeof a||"function"==typeof a)for(let e of p(a))d.call(l,e)||e===r||s(l,e,{get:()=>a[e],enumerable:!(n=c(a,e))||n.enumerable});return l})(e({"external-global-plugin:react"(e,t){t.exports=Spicetify.React}})()),m=t(i()),g=[],b=[],n=r=a=l=v=y=null,S=w=!(h={}),x=async function(){for(;null==Spicetify||!Spicetify.showNotification;)await new Promise(e=>setTimeout(e,100));S=await JSON.parse(localStorage.getItem("spicetify-playlist-labels:show-all")||"false"),await Spicetify.Platform.RootlistAPI._events._emitter.addListener("update",()=>{O().then(e=>{[h,n]=e,w=!0,E()})});var e=`<svg data-encore-id="icon" role="img" viewBox="0 0 16 16" class="Svg-img-icon-small">${Spicetify.SVGIcons.spotify}</svg>`,e=(new Spicetify.Playbar.Button("Show All Saved Playlists",e,e=>{e.active=S=!e.active,localStorage.setItem("spicetify-playlist-labels:show-all",JSON.stringify(S)),w=!0,E()},!1,S),[h,n]=await O(),r=new MutationObserver(()=>{E()}),new MutationObserver(async()=>{await L()}));await L(),e.observe(document.body,{childList:!0,subtree:!0})},(async()=>{await x()})();function P(e){let i=[];return function t(e){"playlist"===e.type?i.push(e):"folder"===e.type&&e.items&&e.items.forEach(e=>t(e))}(e),i}async function O(){var e=await Spicetify.Platform.RootlistAPI.getContents();const l=P(e);var t=await Promise.all(l.map(e=>async function(e){return(await Spicetify.Platform.PlaylistAPI.getContents(e)).items}(e.uri)));const a={};return t.forEach((e,i)=>{e.forEach(e=>{var t=e.uri;a[t]||(a[t]=[]),a[t].some(e=>e.uri===l[i].uri)||a[t].push({uri:l[i].uri,name:l[i].name,trackUid:e.uid,image:(null==(t=l[i].images[0])?void 0:t.url)||"",isOwnPlaylist:l[i].isOwnedBySelf})})}),[a,e]}function E(){b=g;let t=(g=Array.from(document.querySelectorAll(".main-trackList-indexable"))).length!==b.length;for(let e=0;e<g.length;e++)g[e].isEqualNode(b[e])||(t=!0);t&&(v=y=null);const i=[null,null,null,null,"[index] 16px [first] 4fr [var1] 1fr [var2] 2fr [last] minmax(120px,1fr)","[index] 16px [first] 6fr [var1] 4fr [var2] 3fr [var3] 4fr [last] minmax(120px,1fr)","[index] 16px [first] 6fr [var1] 4fr [var2] 3fr [var3] minmax(120px,2fr) [var3] 2fr [last] minmax(120px,1fr)"];let l=null;document.querySelectorAll(".main-trackList-trackListHeaderRow").forEach(e=>{var t=e.querySelector(".main-trackList-rowSectionEnd"),t=parseInt(t.getAttribute("aria-colindex"));(y=y||getComputedStyle(e).gridTemplateColumns)&&i[t]&&(e.style.setProperty("grid-template-columns",i[t],"important"),l=i[t])});for(const e of g){for(const o of e.getElementsByClassName("main-trackList-trackListRow")){a=o,n=void 0;var a,r,n=(a=Object.values(a))?(null==(n=null==(a=null==(a=null==(a=null==(a=null==(a=a[0])?void 0:a.pendingProps)?void 0:a.children[0])?void 0:a.props)?void 0:a.children)?void 0:a.props)?void 0:n.uri)||(null==(n=null==(n=null==(n=null==a?void 0:a.props)?void 0:n.children)?void 0:n.props)?void 0:n.uri)||(null==(n=null==(n=null==(n=null==(n=null==(n=null==a?void 0:a.props)?void 0:n.children)?void 0:n.props)?void 0:n.children)?void 0:n.props)?void 0:n.uri)||(null==(a=null==(n=a[0])?void 0:n.props)?void 0:a.uri):null;let e=o.querySelector(".spicetify-playlist-labels");w&&e&&(e.remove(),e=null),e||(a=o.querySelector(".main-trackList-rowSectionEnd"),r=parseInt(a.getAttribute("aria-colindex")),a.setAttribute("aria-colindex",(r+1).toString()),e=document.createElement("div"),m.default.render(f.default.createElement("div",{className:"spicetify-playlist-labels-labels-container"},null==(n=h[n])?void 0:n.map(e=>{var t;return!S&&!e.isOwnPlaylist||(t=e.uri.match(/spotify:playlist:(.*)/)[1],Spicetify.Platform.History.location.pathname==="/playlist/"+t)?null:f.default.createElement(Spicetify.ReactComponent.TooltipWrapper,{label:e.name,placement:"top"},f.default.createElement("div",{className:"spicetify-playlist-labels-label-container"},f.default.createElement("img",{src:e.image})))})),e),e.setAttribute("aria-colindex",r.toString()),e.role="gridcell",e.style.display="grid",e.classList.add("main-trackList-rowSectionVariable"),e.classList.add("spicetify-playlist-labels"),o.insertBefore(e,a),v=v||getComputedStyle(o).gridTemplateColumns,i[r]&&o.style.setProperty("grid-template-columns",l||i[r],"important"))}w=!1}}async function L(){l=a,(a=document.querySelector("main"))&&!a.isEqualNode(l)&&(l&&r.disconnect(),E(),r.observe(a,{childList:!0,subtree:!0}))}(async()=>{var e;document.getElementById("spicetifyDplaylistDlabels")||((e=document.createElement("style")).id="spicetifyDplaylistDlabels",e.textContent=String.raw`
  .spicetify-playlist-labels-labels-container{height:var(--row-height);align-items:center;display:flex;overflow:hidden;gap:5px}.spicetify-playlist-labels-label-container{position:relative;height:24px}.spicetify-playlist-labels-label-container>img{width:24px;height:100%;-o-object-fit:cover;object-fit:cover;border-radius:2px}
      `.trim(),document.head.appendChild(e))})()}();