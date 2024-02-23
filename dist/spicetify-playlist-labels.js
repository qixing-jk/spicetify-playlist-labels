!async function(){for(;!Spicetify.React||!Spicetify.ReactDOM;)await new Promise(t=>setTimeout(t,10));var o,c,s,p,m,u,t,e,i,r,n,a,l,f,d,y,v,h,b,g;o=Object.create,c=Object.defineProperty,s=Object.getOwnPropertyDescriptor,p=Object.getOwnPropertyNames,m=Object.getPrototypeOf,u=Object.prototype.hasOwnProperty,i=(t=(t,e)=>function(){return e||(0,t[p(t)[0]])((e={exports:{}}).exports,e),e.exports})({"external-global-plugin:react-dom"(t,e){e.exports=Spicetify.ReactDOM}}),r=(e=(t,e,i)=>{i=null!=t?o(m(t)):{};var a=!e&&t&&t.__esModule?i:c(i,"default",{value:t,enumerable:!0}),l=t,r=void 0,n=void 0;if(l&&"object"==typeof l||"function"==typeof l)for(let t of p(l))u.call(a,t)||t===r||c(a,t,{get:()=>l[t],enumerable:!(n=s(l,t))||n.enumerable});return a})(t({"external-global-plugin:react"(t,e){e.exports=Spicetify.React}})()),n=e(i()),v=y=!(d={}),b=h=f=l=a=null,g=async function(){for(;null==Spicetify||!Spicetify.showNotification;)await new Promise(t=>setTimeout(t,100));v=await JSON.parse(localStorage.getItem("spicetify-playlist-labels:show-all")||"false"),await Spicetify.Platform.RootlistAPI._events._emitter.addListener("update",()=>{x().then(t=>{d=t,y=!0,S()})});var t=`<svg data-encore-id="icon" role="img" viewBox="0 0 16 16" class="Svg-img-icon-small">${Spicetify.SVGIcons.spotify}</svg>`,t=(new Spicetify.Playbar.Button("Show All Saved Playlists",t,t=>{t.active=v=!t.active,localStorage.setItem("spicetify-playlist-labels:show-all",JSON.stringify(v)),y=!0,S()},!1,v),d=await x(),f=new MutationObserver(()=>{S()}),new MutationObserver(async()=>{await P()}));await P(),t.observe(document.body,{childList:!0,subtree:!0})},(async()=>{await g()})();function w(t){let i=[];return function e(t){"playlist"===t.type?i.push(t):"folder"===t.type&&t.items&&t.items.forEach(t=>e(t))}(t),i}async function x(){const a=w(await Spicetify.Platform.RootlistAPI.getContents());var t=await Promise.all(a.map(t=>async function(t){return(await Spicetify.Platform.PlaylistAPI.getContents(t)).items}(t.uri)));const l={};return t.forEach((t,i)=>{t.forEach(t=>{var e=t.uri;l[e]||(l[e]=[]),l[e].some(t=>t.uri===a[i].uri)||l[e].push({uri:a[i].uri,name:a[i].name,trackUid:t.uid,image:(null==(e=a[i].images[0])?void 0:e.url)||"",isOwnPlaylist:a[i].isOwnedBySelf})})}),l}function S(){var e,i;0;for(const t of Array.from(document.querySelectorAll(".main-trackList-indexable"))){for(const a of t.getElementsByClassName("main-trackList-trackListRow")){e=a,i=void 0;const l=(e=Object.values(e))?(null==(i=null==(e=null==(e=null==(e=null==(e=null==(e=e[0])?void 0:e.pendingProps)?void 0:e.children[0])?void 0:e.props)?void 0:e.children)?void 0:e.props)?void 0:i.uri)||(null==(i=null==(i=null==(i=null==e?void 0:e.props)?void 0:i.children)?void 0:i.props)?void 0:i.uri)||(null==(i=null==(i=null==(i=null==(i=null==(i=null==e?void 0:e.props)?void 0:i.children)?void 0:i.props)?void 0:i.children)?void 0:i.props)?void 0:i.uri)||(null==(e=null==(i=e[0])?void 0:i.props)?void 0:e.uri):null;h===l&&Spicetify.Platform.History.location.pathname===b&&(a.click(),h=null);let t=a.querySelector(".spicetify-playlist-labels");y&&t&&(t.remove(),t=null),t||(i=a.querySelector(".main-trackList-rowSectionEnd"),(t=document.createElement("div")).classList.add("spicetify-playlist-labels"),n.default.render(r.default.createElement("div",{className:"spicetify-playlist-labels-labels-container"},null==(e=d[l])?void 0:e.map(e=>{var t;return!v&&!e.isOwnPlaylist||(t=e.uri.match(/spotify:playlist:(.*)/)[1],Spicetify.Platform.History.location.pathname==="/playlist/"+t)?null:r.default.createElement(Spicetify.ReactComponent.TooltipWrapper,{label:e.name,placement:"top"},r.default.createElement("div",null,r.default.createElement(Spicetify.ReactComponent.RightClickMenu,{placement:"bottom-end",menu:r.default.createElement(Spicetify.ReactComponent.Menu,null,r.default.createElement(Spicetify.ReactComponent.MenuItem,{leadingIcon:r.default.createElement(Spicetify.ReactComponent.IconComponent,{semanticColor:"textBase",dangerouslySetInnerHTML:{__html:'<path d="M5.25 3v-.917C5.25.933 6.183 0 7.333 0h1.334c1.15 0 2.083.933 2.083 2.083V3h4.75v1.5h-.972l-1.257 9.544A2.25 2.25 0 0 1 11.041 16H4.96a2.25 2.25 0 0 1-2.23-1.956L1.472 4.5H.5V3h4.75zm1.5-.917V3h2.5v-.917a.583.583 0 0 0-.583-.583H7.333a.583.583 0 0 0-.583.583zM2.986 4.5l1.23 9.348a.75.75 0 0 0 .744.652h6.08a.75.75 0 0 0 .744-.652L13.015 4.5H2.985z"></path>'},iconSize:16}),onClick:t=>{t.stopPropagation(),async function(t,e){await Spicetify.Platform.PlaylistAPI.remove(t,[{uri:e,uid:""}])}(e.uri,l),d[l]=d[l].filter(t=>t.name!==e.name),y=!0,S()}},"Remove from ",e.name))},r.default.createElement("div",{className:"spicetify-playlist-labels-label-container",style:{cursor:"pointer"},onClick:t=>{t.stopPropagation();t=null==(t=Spicetify.URI.fromString(e.uri))?void 0:t.toURLPath(!0);h=l,(b=t)&&Spicetify.Platform.History.push({pathname:t,search:"?uid="+e.trackUid})}},r.default.createElement("img",{src:e.image})))))})),t),i.insertBefore(t,i.firstChild))}y=!1}}async function P(){a=l,(l=document.querySelector("main"))&&!l.isEqualNode(a)&&(a&&f.disconnect(),S(),f.observe(l,{childList:!0,subtree:!0}))}(async()=>{var t;document.getElementById("spicetifyDplaylistDlabels")||((t=document.createElement("style")).id="spicetifyDplaylistDlabels",t.textContent=String.raw`
  :root{--spicetify-playlist-labels-size:28px;--spicetify-playlist-labels-gap:6px;--spicetify-playlist-labels-container-width:calc(var(--spicetify-playlist-labels-size) * 8 + var(--spicetify-playlist-labels-gap) * 7);--spicetify-playlist-labels-column-width:calc(var(--spicetify-playlist-labels-size) * 8 + var(--spicetify-playlist-labels-gap) * 7 + 12px + 120px)}.spicetify-playlist-labels-labels-container{width:var(--spicetify-playlist-labels-container-width);height:var(--row-height);align-items:center;display:flex;overflow:hidden;gap:var(--spicetify-playlist-labels-gap);justify-content:flex-end}.spicetify-playlist-labels-label-container{position:relative;height:calc(var(--row-height) * .5)}.spicetify-playlist-labels-label-container>img{width:calc(var(--row-height) * .5);height:100%;-o-object-fit:cover;object-fit:cover;border-radius:calc(var(--row-height) * .5 * .1)}.main-trackList-trackList.main-trackList-indexable[aria-colcount="4"] .main-trackList-trackListRowGrid{grid-template-columns:[index] var(--tracklist-index-column-width,16px) [first] minmax(120px,var(--col1,4fr)) [var1] minmax(120px,var(--col2,2fr)) [last] minmax(var(--spicetify-playlist-labels-column-width),var(--col2,1fr))!important}.main-trackList-trackList.main-trackList-indexable[aria-colcount="5"] .main-trackList-trackListRowGrid{grid-template-columns:[index] var(--tracklist-index-column-width,16px) [first] minmax(120px,var(--col1,6fr)) [var1] minmax(120px,var(--col2,4fr)) [var2] minmax(120px,var(--col3,3fr)) [last] minmax(var(--spicetify-playlist-labels-column-width),var(--col4,1fr))!important}.main-trackList-trackList.main-trackList-indexable[aria-colcount="6"] .main-trackList-trackListRowGrid{grid-template-columns:[index] var(--tracklist-index-column-width,16px) [first] minmax(120px,var(--col1,6fr)) [var1] minmax(120px,var(--col2,4fr)) [var2] minmax(120px,var(--col3,3fr)) [var3] minmax(120px,var(--col4,2fr)) [last] minmax(var(--spicetify-playlist-labels-column-width),var(--col5,1fr))!important}
      `.trim(),document.head.appendChild(t))})()}();