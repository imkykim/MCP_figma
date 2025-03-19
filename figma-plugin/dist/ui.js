(()=>{function e(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,n=t?"DEBUG: ".concat(e,": ").concat(JSON.stringify(t)):"DEBUG: ".concat(e);console.log(n),parent.postMessage({pluginMessage:{type:"debug-log",message:n}},"*")}document.addEventListener("DOMContentLoaded",(function(){e("UI initialized");var t=document.getElementById("main-view"),n=document.getElementById("generator-view"),o=document.getElementById("connect-view"),c=document.getElementById("settings-view"),s=document.getElementById("status-indicator"),a=document.getElementById("status-text"),i=document.getElementById("template-container"),r=!1,d=null;function l(n){try{return e("Attempting to connect to WebSocket",{url:n}),d&&(e("Closing existing WebSocket connection"),d.close()),e("Creating new WebSocket connection"),(d=new WebSocket(n)).onopen=function(){e("WebSocket connection opened"),r=!0,u(),document.getElementById("connection-success").textContent="MCP 서버에 연결되었습니다.",document.getElementById("connection-success").style.display="block",parent.postMessage({pluginMessage:{type:"ws-connected"}},"*");try{e("Sending test message to server"),d.send(JSON.stringify({type:"TEST_CONNECTION",message:"Hello from Figma plugin"}))}catch(t){e("Error sending test message",{error:t.toString()})}setTimeout((function(){return m(t)}),1500)},d.onmessage=function(t){e("WebSocket message received",{data:t.data});try{var n=JSON.parse(t.data);parent.postMessage({pluginMessage:{type:"ws-message",data:n}},"*")}catch(n){e("WebSocket message parsing error",{error:n.toString(),rawData:t.data})}},d.onerror=function(t){e("WebSocket error",{error:t.toString()}),r=!1,u(),document.getElementById("connection-error").textContent="MCP 서버 연결 중 오류가 발생했습니다.",document.getElementById("connection-error").style.display="block",parent.postMessage({pluginMessage:{type:"ws-error",error:"연결 오류"}},"*")},d.onclose=function(t){e("WebSocket connection closed",{code:t.code,reason:t.reason}),r=!1,u(),parent.postMessage({pluginMessage:{type:"ws-disconnected"}},"*")},!0}catch(t){return e("Error creating WebSocket",{error:t.toString()}),r=!1,u(),document.getElementById("connection-error").textContent="연결 오류: ".concat(t.message),document.getElementById("connection-error").style.display="block",parent.postMessage({pluginMessage:{type:"ws-error",error:t.message}},"*"),!1}}function g(){e("Disconnecting WebSocket"),d&&(d.close(),d=null)}function m(t){e("Showing view",{view:t.id}),document.querySelectorAll(".view").forEach((function(e){e.classList.remove("active")})),t.classList.add("active")}function u(){e("Updating connection status",{isConnected:r}),s&&a&&(r?(s.classList.remove("disconnected"),s.classList.add("connected"),a.textContent="연결됨"):(s.classList.remove("connected"),s.classList.add("disconnected"),a.textContent="연결 끊김"))}function p(t){e("Displaying templates",{count:null==t?void 0:t.length}),i&&(i.innerHTML="",t.forEach((function(e){var t=document.createElement("div");t.className="template-card",t.dataset.template=e.id;var n=document.createElement("h3");n.textContent=e.name;var o=document.createElement("p");o.textContent=e.description,t.appendChild(n),t.appendChild(o),t.addEventListener("click",(function(){document.querySelectorAll(".template-card").forEach((function(e){e.classList.remove("selected")})),t.classList.add("selected")})),i.appendChild(t)})))}function y(t){var n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"info";e("Showing notification",{message:t,type:n});var o=document.createElement("div");switch(o.className="notification ".concat(n),o.textContent=t,o.style.position="fixed",o.style.bottom="20px",o.style.left="50%",o.style.transform="translateX(-50%)",o.style.padding="10px 20px",o.style.borderRadius="4px",o.style.zIndex="1000",n){case"error":o.style.backgroundColor="#f44336",o.style.color="white";break;case"success":o.style.backgroundColor="#4caf50",o.style.color="white";break;default:o.style.backgroundColor="#2196f3",o.style.color="white"}document.body.appendChild(o),setTimeout((function(){document.body.contains(o)&&document.body.removeChild(o)}),3e3)}m(t),u(),document.getElementById("create-portfolio-btn").addEventListener("click",(function(){e("Create portfolio button clicked"),m(n),r?parent.postMessage({pluginMessage:{type:"getTemplates"}},"*"):(e("Displaying default templates"),p([{id:"minimalist",name:"미니멀리스트",description:"깔끔하고 간결한 디자인"},{id:"project-showcase",name:"프로젝트 쇼케이스",description:"프로젝트 중심 레이아웃"},{id:"creative",name:"크리에이티브",description:"창의적이고 예술적인 디자인"}]))})),document.getElementById("connect-btn").addEventListener("click",(function(){e("Connect button clicked"),m(o)})),document.getElementById("settings-btn").addEventListener("click",(function(){e("Settings button clicked"),m(c)})),document.getElementById("connect-server-btn").addEventListener("click",(function(){var t=document.getElementById("server-url").value;if(e("Connect server button clicked",{serverUrl:t}),t)try{l(t),parent.postMessage({pluginMessage:{type:"connect",serverUrl:t}},"*"),document.getElementById("connection-error").style.display="none",document.getElementById("connection-success").style.display="none"}catch(t){e("Error sending connection message",{error:t.toString()}),document.getElementById("connection-error").textContent="Error: ".concat(t.message),document.getElementById("connection-error").style.display="block"}})),document.getElementById("disconnect-server-btn").addEventListener("click",(function(){e("Disconnect button clicked"),g(),parent.postMessage({pluginMessage:{type:"disconnect"}},"*")})),document.getElementById("save-settings-btn").addEventListener("click",(function(){var n=document.getElementById("ai-model").value,o=document.getElementById("design-style").value;e("Save settings button clicked",{aiModel:n,designStyle:o}),parent.postMessage({pluginMessage:{type:"saveSettings",settings:{aiModel:n,designStyle:o}}},"*"),m(t)})),document.getElementById("generator-back-btn").addEventListener("click",(function(){e("Generator back button clicked"),m(t)})),document.getElementById("connect-back-btn").addEventListener("click",(function(){e("Connect back button clicked"),m(t)})),document.getElementById("settings-back-btn").addEventListener("click",(function(){e("Settings back button clicked"),m(t)})),document.getElementById("generate-btn").addEventListener("click",(function(){var t=document.getElementById("portfolio-name").value||"포트폴리오",n=document.getElementById("designer-name").value||"디자이너 이름";e("Generate button clicked",{portfolioName:t,designerName:n});var o=document.querySelector(".template-card.selected");if(o){var c=o.dataset.template;e("Selected template",{templateId:c}),parent.postMessage({pluginMessage:{type:"generate-portfolio",template:c,data:{name:t,designer:n}}},"*"),document.getElementById("generate-btn").disabled=!0,document.getElementById("generate-btn").textContent="생성 중..."}else y("템플릿을 선택해주세요","error")})),window.onmessage=function(s){var a,i=s.data.pluginMessage;if(i)switch(e("Received message from plugin",i),i.type){case"establish-connection":e("Establishing connection",{serverUrl:i.serverUrl}),l(i.serverUrl);break;case"disconnect-connection":e("Disconnecting by plugin request"),g();break;case"ws-send":e("Plugin requested to send message",i.data),function(t){e("Sending WebSocket message",t),d&&d.readyState===WebSocket.OPEN?d.send(JSON.stringify(t)):(e("Cannot send message: WebSocket is not connected",{connected:!!d,readyState:d?d.readyState:"null"}),y("WebSocket is not connected","error"))}(i.data);break;case"templatesList":e("Received templates list",{count:null===(a=i.templates)||void 0===a?void 0:a.length}),p(i.templates);break;case"generationSuccess":e("Portfolio generation successful"),document.getElementById("generate-btn").disabled=!1,document.getElementById("generate-btn").textContent="포트폴리오 생성",y("포트폴리오가 성공적으로 생성되었습니다!","success"),setTimeout((function(){return m(t)}),1500);break;case"generationFailed":e("Portfolio generation failed",{error:i.error}),document.getElementById("generate-btn").disabled=!1,document.getElementById("generate-btn").textContent="포트폴리오 생성",y("생성 실패: ".concat(i.error),"error");break;case"connected":e("Plugin reports connected state"),r=!0,u();break;case"disconnected":e("Plugin reports disconnected state"),r=!1,u();break;case"show-generator":e("Showing generator view"),m(n);break;case"show-connect":e("Showing connect view"),m(o);break;case"show-settings":e("Showing settings view"),m(c);break;case"settings":e("Received settings",i.settings),i.settings&&(document.getElementById("ai-model").value=i.settings.aiModel||"claude-3-sonnet",document.getElementById("design-style").value=i.settings.designStyle||"modern");break;case"notify":e("Notification from plugin",{message:i.message,level:i.level}),y(i.message,i.level||"info")}},e("Requesting initial settings and connection status"),parent.postMessage({pluginMessage:{type:"getSettings"}},"*"),parent.postMessage({pluginMessage:{type:"checkConnection"}},"*")}))})();