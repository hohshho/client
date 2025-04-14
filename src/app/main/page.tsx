"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

// 타입 선언
declare const Module: {
    XDSetMouseState: (state: number) => void;
    getMap: () => {
        getInputPoints: () => {
            get: (index: number) => {
                Longitude: number;
                Latitude: number;
                Altitude: number;
            };
        };
        clearInputPoint: () => void;
    };
    JSLayerList: new (arg: boolean) => {
        nameAtLayer: (name: string) => Layer | null;
        createLayer: (name: string, type: number) => Layer;
    };
    ELT_3DPOINT: number;
    createPoint: (id: string) => POI;
    JSVector3D: new (x: number, y: number, z: number) => Vector3D;
};

interface POI {
    setPosition: (pos: Vector3D) => void;
    setImage: (
        pixelData: Uint8ClampedArray,
        width: number,
        height: number
    ) => void;
    setText: (text: string) => void;
}

interface Vector3D {
    x: number;
    y: number;
    z: number;
}

interface Layer {
    addObject: (obj: POI, index: number) => void;
    removeAtKey: (key: string) => void;
}

interface Point {
    Longitude: number;
    Latitude: number;
    Altitude: number;
}

interface DeletePOIEvent {
    layerName: string;
    objKey: string;
}

export default function Main() {
    const mouseMode = useRef(1);
    const POICount = useRef(0);
    const POIList = useRef<number[]>([]);

    useEffect(() => {
        const handlePOIDeleteRequest = (event: CustomEvent) => {
            handleDeletePOI(event.detail);
        };
        
        // 이벤트 리스너 등록
        document.addEventListener(
            "POI_DELETE_REQUEST", 
            handlePOIDeleteRequest as EventListener
        );
        
        // 클린업 함수
        return () => {
            document.removeEventListener(
                "POI_DELETE_REQUEST", 
                handlePOIDeleteRequest as EventListener
            );
        };
    }, []);

    const handleClickLoadDb = async () => {
        console.log("DB 데이터 불러오기 시작");

        try {
            const response = await fetch(
                "http://localhost:3000/api/getJsonReadDb",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                }
            );
            if (!response.ok) throw new Error(`HTTP 오류: ${response.status}`);

            const data: {
                id: number;
                text: string;
                longitude: number;
                latitude: number;
                altitude: number;
            }[] = await response.json();

            data.forEach((item) => {
                if (!POIList.current.includes(item.id)) {
                    createPOI(
                        item.id,
                        item.text,
                        item.longitude,
                        item.latitude,
                        item.altitude
                    );
                }
            });

            console.log("DB 데이터 불러오기 완료");
        } catch (error) {
            console.error("DB 데이터 불러오기 실패:", error);
        }
    };

    const handleSetMouseState = (mouseState: number) => () => {
        console.log(`마우스 모드 변경: ${mouseState}`);
        mouseMode.current = mouseState;
        const mapElement: HTMLElement = document.getElementById("map")!;
        Module.XDSetMouseState(mouseMode.current);
        if (mouseMode.current == 20) {
            mapElement.addEventListener("click", clickMap);
        } 
        // else if (mouseMode.current == 6) {
        //     mapElement.addEventListener("click", handleDeletePOI);
        // }
        else {
            mapElement.removeEventListener("click", clickMap);
            // mapElement.removeEventListener("click", handleDeletePOI);
        }
    };

    const handleDeletePOI = async (e: any): Promise<void> => {
        try {
            // 디버깅을 위한 로그
            console.log("삭제 이벤트 발생:", e);
            
            // 레이어 정보 확인
            if (!e.layerName || !e.objKey) {
                console.error("레이어 이름 또는 객체 키가 없습니다:", e);
                return;
            }
            
            const layerList = new Module.JSLayerList(true);
            const layer = layerList.nameAtLayer(e.layerName);
            
            if (!layer) {
                console.error("레이어를 찾을 수 없습니다:", e.layerName);
                return;
            }
    
            // 객체 키를 숫자로 변환
            const objId = parseInt(e.objKey);
            
            // fetch API를 사용하여 삭제 요청 보내기
            const response = await fetch(
                "http://localhost:3000/api/deletePOI",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ id: objId }),
                }
            );
    
            if (!response.ok) {
                throw new Error(`HTTP 오류: ${response.status}`);
            }
    
            const result = await response.json();
            console.log("POI 삭제 성공:", result);
    
            // POIList에서 해당 ID 제거
            POICount.current -= 1;
            POIList.current = POIList.current.filter(
                (key) => key !== objId
            );
    
            // 맵에서 POI 제거
            layer.removeAtKey(e.objKey);
        } catch (error) {
            console.error("POI 삭제 실패:", error);
        }
    };

    const clickMap = async () => {
        const map = Module.getMap();
        const inputPoint = map.getInputPoints();
        const point: Point = inputPoint.get(0);

        if (
            point.Longitude === 0 ||
            point.Latitude === 0 ||
            point.Altitude === 0
        ) {
            return;
        }
        // Initialize input points
        map.clearInputPoint();

        try {
            const response = await fetch("http://localhost:3000/api/addPOI", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    longitude: point.Longitude,
                    latitude: point.Latitude,
                    altitude: point.Altitude,
                }),
            });

            if (!response.ok)
                throw new Error(`HTTP error! status: ${response.status}`);
            const key: number = await response.json();

            // POI 생성 함수 호출
            createPOI(
                key,
                "insert DB",
                point.Longitude,
                point.Latitude,
                point.Altitude
            );
        } catch (error) {
            console.error("POI 추가 실패:", error);
        }
    };

    const createPOI = (
        key: number,
        name: string,
        longitude: number,
        latitude: number,
        altitude: number
    ): void => {
        const layerList = new Module.JSLayerList(true);
        let layer: Layer | null = layerList.nameAtLayer("POI_LAYER");
    
        if (layer === null) {
            layer = layerList.createLayer("POI_LAYER", Module.ELT_3DPOINT);
        }
    
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
    
            if (!ctx) return;
    
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
    
            const id: string = key.toString();
            const poi = Module.createPoint(id);
            poi.setPosition(
                new Module.JSVector3D(longitude, latitude, altitude)
            );
    
            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            poi.setImage(imageData.data, img.width, img.height);
            poi.setText(name);
    
            POIList.current.push(key);
            POICount.current += 1;
    
            // layer는 클로저를 통해 접근 가능
            if (layer) {
                layer.addObject(poi, 0);
            }
        };
    
        img.src = "/resources/images/contents/pin.png";
    };

    return (
        <>
            {/* Script 로딩 - beforeInteractive 전략 유지 */}
            <Script
                src="/resources/js/use/init.js"
                strategy="beforeInteractive"
            />

            <div id="map" />

            <div id="interface">
                <span>[Mouse Mode]</span>{" "}
                <button onClick={handleClickLoadDb}>DB Data Load</button>
                <br />
                <span>[Mouse Mode]</span>{" "}
                <input
                    type="radio"
                    name="mouseMode"
                    onClick={handleSetMouseState(1)}
                    defaultChecked
                />{" "}
                Move map{" "}
                <input
                    type="radio"
                    name="mouseMode"
                    onClick={handleSetMouseState(20)}
                />{" "}
                Add POI{" "}
                <input
                    type="radio"
                    name="mouseMode"
                    onClick={handleSetMouseState(6)}
                />{" "}
                Remove POI
            </div>
        </>
    );
}
