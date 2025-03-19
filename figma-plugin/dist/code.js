({686:function(){var e=this&&this.__awaiter||function(e,t,n,a){return new(n||(n=Promise))((function(i,o){function r(e){try{l(a.next(e))}catch(e){o(e)}}function c(e){try{l(a.throw(e))}catch(e){o(e)}}function l(e){var t;e.done?i(e.value):(t=e.value,t instanceof n?t:new n((function(e){e(t)}))).then(r,c)}l((a=a.apply(e,t||[])).next())}))};let t=null,n=!1,a=null,i=(new Map,"ws://localhost:9000");const o={colors:{primary:{r:.1,g:.1,b:.9,a:1},secondary:{r:.2,g:.2,b:.7,a:1},accent:{r:.9,g:.2,b:.2,a:1},text:{r:.1,g:.1,b:.1,a:1},background:{r:1,g:1,b:1,a:1},gray:{r:.9,g:.9,b:.9,a:1}},text:{heading:{fontName:{family:"Inter",style:"Bold"},fontSize:32},subheading:{fontName:{family:"Inter",style:"SemiBold"},fontSize:24},body:{fontName:{family:"Inter",style:"Regular"},fontSize:16},caption:{fontName:{family:"Inter",style:"Regular"},fontSize:12}},spacing:{small:8,medium:16,large:24,xlarge:40}};function r(r){return e(this,void 0,void 0,(function*(){try{null!==t&&c(),i=r,t=new WebSocket(i),t.onopen=()=>{n=!0,figma.notify("MCP 서버에 연결되었습니다."),figma.ui.postMessage({type:"connected"})},t.onmessage=t=>{try{!function(t){switch(t.type){case"CONNECTION_ESTABLISHED":a=t.connectionId,figma.notify(`MCP 서버에 연결되었습니다. (ID: ${a})`);break;case"EXECUTE_COMMAND":!function(t,i,r){e(this,void 0,void 0,(function*(){try{let c=null;switch(t){case"createFrame":c=yield s(i);break;case"createText":c=yield d(i);break;case"createRectangle":c=yield function(t){return e(this,void 0,void 0,(function*(){const{frameId:e,x:n=0,y:a=0,width:i=100,height:r=100,color:c=o.colors.gray,cornerRadius:l=0}=t,s=figma.createRectangle();if(s.x=n,s.y=a,s.resize(i,r),s.fills=[{type:"SOLID",color:c}],l>0&&(s.cornerRadius=l),e){const t=figma.getNodeById(e);t&&"FRAME"===t.type?t.appendChild(s):figma.currentPage.appendChild(s)}else figma.currentPage.appendChild(s);return{id:s.id}}))}(i);break;case"createImagePlaceholder":c=yield function(t){return e(this,void 0,void 0,(function*(){const{frameId:e,name:n="Image Placeholder",x:a=0,y:i=0,width:r=300,height:c=200,color:l={r:.8,g:.8,b:.8,a:1}}=t,s=figma.createFrame();s.name=n,s.x=a,s.y=i,s.resize(r,c),s.fills=[{type:"SOLID",color:l}];const d=figma.createRectangle();d.resize(.3*r,.3*c),d.x=.35*r,d.y=.25*c,d.fills=[{type:"SOLID",color:{r:.6,g:.6,b:.6,a:1}}],s.appendChild(d);const g=figma.createText();if(yield figma.loadFontAsync(o.text.caption.fontName),g.fontName=o.text.caption.fontName,g.fontSize=o.text.caption.fontSize,g.characters="Add Image",g.textAlignHorizontal="CENTER",g.x=.5*r-g.width/2,g.y=.6*c,g.fills=[{type:"SOLID",color:{r:.4,g:.4,b:.4,a:1}}],s.appendChild(g),e){const t=figma.getNodeById(e);t&&"FRAME"===t.type?t.appendChild(s):figma.currentPage.appendChild(s)}else figma.currentPage.appendChild(s);return{id:s.id,name:s.name}}))}(i);break;case"createSection":c=yield function(t){return e(this,void 0,void 0,(function*(){const{frameId:e,title:n="Section Title",x:a=0,y:i=0,width:r=800,backgroundColor:c=null}=t;let l;if(e){if(l=figma.getNodeById(e),!l||"FRAME"!==l.type)throw new Error("유효하지 않은 프레임 ID")}else l=figma.currentPage;const s=figma.createFrame();s.name=n,s.x=a,s.y=i,s.resize(r,200),s.fills=c?[{type:"SOLID",color:c}]:[];const g=yield d({text:n,x:o.spacing.medium,y:o.spacing.medium,width:r-2*o.spacing.medium,styleType:"subheading"}),f=figma.getNodeById(g.id);s.appendChild(f);const m=figma.createLine();yield figma.loadFontAsync(o.text.body.fontName);const u=f.height+2*o.spacing.medium;return m.x=0,m.y=u,m.resize(r,0),m.strokes=[{type:"SOLID",color:{r:.9,g:.9,b:.9,a:1}}],s.appendChild(m),s.resize(r,u+o.spacing.large),l.appendChild(s),{id:s.id,name:s.name,height:s.height,contentY:u+o.spacing.medium}}))}(i);break;case"applyTemplate":c=yield g(i);break;case"getPluginInfo":c={version:"1.0.0",connected:n,connectionId:a};break;default:throw new Error(`알 수 없는 명령: ${t}`)}l(r,c)}catch(e){console.error(`명령 실행 중 오류 (${t}):`,e),l(r,null,e.message)}}))}(t.command,t.params,t.commandId);break;default:console.log("알 수 없는 메시지 타입:",t.type)}}(JSON.parse(t.data))}catch(e){console.error("메시지 처리 중 오류:",e)}},t.onclose=()=>{n=!1,a=null,figma.notify("MCP 서버와의 연결이 종료되었습니다."),figma.ui.postMessage({type:"disconnected"})},t.onerror=e=>{console.error("WebSocket 오류:",e),figma.notify("MCP 서버 연결 중 오류가 발생했습니다."),figma.ui.postMessage({type:"error",message:"연결 오류"})}}catch(e){console.error("MCP 서버 연결 중 오류:",e),figma.notify("MCP 서버 연결 중 오류가 발생했습니다.")}}))}function c(){t&&(t.close(),t=null,n=!1,a=null)}function l(e,a,i=null){var o;o={type:"COMMAND_RESPONSE",commandId:e,result:a,error:i},n&&t&&t.readyState===WebSocket.OPEN?t.send(JSON.stringify(o)):figma.notify("MCP 서버에 연결되어 있지 않습니다.")}function s(t){return e(this,void 0,void 0,(function*(){const{name:e="New Frame",width:n=800,height:a=600,x:i=0,y:r=0,backgroundColor:c=o.colors.background}=t,l=figma.createFrame();return l.name=e,l.resize(n,a),l.x=i,l.y=r,l.fills=[{type:"SOLID",color:c}],figma.currentPage.appendChild(l),{id:l.id,name:l.name}}))}function d(t){return e(this,void 0,void 0,(function*(){const{text:e="",frameId:n,x:a=0,y:i=0,width:r=300,styleType:c="body",color:l=o.colors.text,horizontalAlignment:s="LEFT"}=t,d=o.text[c]||o.text.body,g=figma.createText();if(g.characters=e,g.x=a,g.y=i,g.resize(r,g.height),g.textAlignHorizontal=s,yield figma.loadFontAsync(d.fontName),g.fontName=d.fontName,g.fontSize=d.fontSize,g.fills=[{type:"SOLID",color:l}],n){const e=figma.getNodeById(n);e&&"FRAME"===e.type?e.appendChild(g):figma.currentPage.appendChild(g)}else figma.currentPage.appendChild(g);return{id:g.id,text:g.characters}}))}function g(t){return e(this,void 0,void 0,(function*(){const{template:e,data:n}=t;return yield s({name:(null==n?void 0:n.name)||"포트폴리오",width:1920,height:1080,backgroundColor:o.colors.background})}))}figma.showUI(__html__,{width:400,height:500}),figma.ui.onmessage=t=>e(void 0,void 0,void 0,(function*(){switch(t.type){case"connect":yield r(t.serverUrl||i);break;case"disconnect":c();break;case"generate-portfolio":yield function(t,n){return e(this,void 0,void 0,(function*(){try{if(!t)return void figma.notify("템플릿이 지정되지 않았습니다.");figma.notify("포트폴리오 생성 중...");const e=figma.createPage();e.name=(null==n?void 0:n.name)||"포트폴리오",figma.currentPage=e;const a=yield g({template:t,data:n});return figma.notify("포트폴리오가 생성되었습니다!"),a}catch(e){console.error("포트폴리오 생성 중 오류:",e),figma.notify(`오류: ${e.message}`)}}))}(t.template,t.data);break;case"notify":figma.notify(t.message);break;case"close-plugin":figma.closePlugin(t.message)}})),figma.on("run",(({command:e})=>{switch(e){case"generate-portfolio":figma.ui.postMessage({type:"show-generator"});break;case"connect-mcp":r(i);break;case"show-settings":figma.ui.postMessage({type:"show-settings"})}}))}})[686]();