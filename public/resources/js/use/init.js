var ENGINE_PATH = "./resources/js/engine/"

function init() {
	// 엔진 초기화 API 호출
	Module.initialize({
		container: document.getElementById("map"),
		terrain: {
			dem: {
				url: 'http://192.168.50.248:28080',
				name: 'dem_korea_5m',
				servername: 'XDServer',
				encoding: false
			},
			image: {
				url: 'http://192.168.50.248:28080',
				name: 'omap_korea_2024',
				servername: 'XDServer'
			}
		},
		worker: {
                use: true,
                path: ENGINE_PATH + 'XDWorldWorker.js',
                count: 5
            },
		defaultKey: "DFG~EpIREQDmdJe1E9QpdBca#FBSDJFmdzHoe(fB4!e1E(JS1I=="
	});

	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(
			// 성공 콜백
			(position) => {
				// const lon = position.coords.longitude;
				// const lat = position.coords.latitude;
				const lon = 127.06205102069177;
				const lat = 37.50848251498306;
				console.log("경도 : " + lon + "/ 위도 : " + lat);
				// 위치 정보 사용
				Module.XDSetCamPositionLonLat(lon, lat, 1000, 90);
			},
			// 에러 콜백
			(error) => {
				// 기본 서울시청
				Module.XDSetCamPositionLonLat(126.977829, 37.566317, 1000, 90);
			}
		);
	} else {
		alert("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
	}

	Module.XDEMapCreateLayer("eMap_Hybrid_2024", "http://192.168.50.248:28080/XDServer/gwc", 0, true, true, false,10, 0, 16)

	// requestImageMapData() // xdserver poi 이미지불러오기

	Module.XDEMapCreateLayer("poi_3d_result_4", "http://192.168.50.248:28080", 0, true, true, false,5, 0, 18)
	// function requestImageMapData() {
	// 	var proxy = '/resources/js/proxy.jsp'
	// 	var _url = `http://192.168.50.248:28080/XDServer/rest/v1/getImageMapData?layername=${encodeURIComponent('poi_3d_result_4')}`;
	// 	var xhr = new XMLHttpRequest();
	// 	xhr.open("GET", _url);
	// 	xhr.responseType = "arraybuffer";

	// 	xhr.onload = function() {
	// 		parseImageMap(xhr.response);
	// 	};
	// 	xhr.onerror = onerror;
	// 	xhr.send(null);
	// }
	// function parseImageMap(_data) {
	// 	//console.log("parseImageMap : " + _data);
	// 	Module.getSymbol().parseIamgeMap(_data);

	// }

	// Module.canvas.addEventListener("click", function(e){
		// if(mouseMode == 20) {
		// 	ClickCreateLine(e);
		// }
	// })
	// Module.canvas.addEventListener("Fire_EventSelectedObject", function(e) {
	// 	handleDeletePOI(e);
	// });
	Module.canvas.addEventListener("Fire_EventSelectedObject", function(e) {
		// 커스텀 이벤트 생성 및 발생
		const customEvent = new CustomEvent("POI_DELETE_REQUEST", { 
			detail: {
				layerName: e.layerName,
				objKey: e.objKey
			} 
		});
		document.dispatchEvent(customEvent);
	});
	
}

var script = document.createElement('script');
script.src = ENGINE_PATH + 'XDWorldEM.js';
document.body.appendChild(script);

var Module = {
	TOTAL_MEMORY: 256 * 1024 * 1024,
	postRun: [init],
};

//브라우저 사이즈 조절할 때, map 크기 조정
function mouseOverInterface(_isOver) {
	if (typeof Module == "object") {
		Module.XDIsMouseOverDiv(_isOver);
	}
}
window.onresize = function(e) {
	if (typeof Module == 'object') {
		if (typeof Module.Resize == 'function') {
			Module.Resize(window.innerWidth, window.innerHeight);
			Module.XDRenderData();
		}
	}
};