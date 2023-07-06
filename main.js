import './style.css';
import Graticule from 'ol/layer/Graticule.js';
import {boundingExtent} from 'ol/extent';
import 'ol/extent';
import {Map, View} from 'ol';
import {DragBox, Select} from 'ol/interaction.js';
import { Circle as CircleStyle,
  Fill,
  Stroke,
  Style,
  Text,} from 'ol/style.js';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import {Cluster, Vector as VectorSource} from 'ol/source';
import {fromLonLat} from 'ol/proj';
import {toStringXY} from 'ol/coordinate.js';

// open layers map default projection is the Web Mercator projection (EPSG:3857)
// EPSG:4326 - is in degrees- think GLOBE - 3D sphere coordinate system on the surface of a sphere or ellipsoid of reference.
// EPSG:3857 - is in metres - think map flat - 2D projection coordinate system PROJECTED from the surface of the sphere or ellipsoid to a flat surface
 
// Baselayer
const base_layer = new TileLayer({ source: new OSM()})

// Long and lat lines on the map
const latlon_line_layer = new Graticule({
  // the style to use for the lines, optional.
  strokeStyle: new Stroke({
    color: 'rgba(255,120,0,0.7)',
    width: 1,
    lineDash: [0.9, 7],
  }),
  showLabels: true,
  wrapX: false,
});

//tje data source
const doc_vector_source = new VectorSource();

// The data
const clusterSource = new Cluster({
  distance: parseInt(7.5, 10),
  minDistance: parseInt(5, 10),
  source: doc_vector_source,
});

const document_layer = new VectorLayer({
  source: clusterSource,
  style: {
    'fill-color': 'rgba(255, 255, 255, 0.6)',
    'stroke-width': 1,
    'stroke-color': '#319FD3',
    'circle-radius': 5,
    'circle-fill-color': 'rgba(255, 255, 255, 0.6)',
    'circle-stroke-width': 1,
    'circle-stroke-color': '#319FD3',
  }
});

const map = new Map({
  target: 'map',
  layers: [base_layer, latlon_line_layer, document_layer ],
  view: new View({
    center: [0, 0],
    zoom: 2
  })
});

// request custom data parser
const client = new XMLHttpRequest();

client.open('GET', 'https://www.localhostdomain.com/rest/get_documents?collections=sightings&latStart=-65&latEnd=66&startTime=2018-07-11T12:00:40&endTime=2018-15-12T12:50:40&includeEdges=true&edgeCollections=edge-sightings');

client.onload = function () {
  const req_docs =  JSON.parse(client.responseText);
  const features = [];
  for (const req_doc of req_docs) {
    var lon = parseFloat(req_doc.doc?.longitude)
    var lat = parseFloat(req_doc.doc?.latitude)
    if (isNaN(lon) || isNaN(lat)) {
      continue;
    }
    // Create empty object for all related lon lan in doc and linked doc need for bounding box creatation 
    var bounds = [[lon,lat]];
    //console.log("Bounds DOC" + JSON.stringify(bounds) );
    // Create sub_feature object that will hold linked docs if main doc is clicked
    // Sub Doc Loop 
    var sub_features = [];
    for (const sub_doc of req_doc.connectedDocs) {
      var sub_lon = parseFloat(sub_doc?.longitude)
      var sub_lat = parseFloat(sub_doc?.latitude)
      if (isNaN(sub_lon) || isNaN(sub_lat)) {
        continue;
      }
      //add point to calculation list for bounding box 
      bounds.push([sub_lon, sub_lat]);
      // linked docs
      sub_features.push(
        new Feature({
          id: sub_doc._id || 0,
          lat: sub_lat ,
          lon: sub_lon ,
          //geometry: new Point(fromLonLat([sub_lon, sub_lat])), 
        })
      );
    }
    // End sub doc loop 
    // Add new feature(document) with is links info and push the it to the display list.
   // var feature_extent = boundingExtent(bounds)
    features.push(
      new Feature({
        id:  document._id,
        species: document.species,
        geometry: new Point(fromLonLat([lon, lat])),
        sub_features: sub_features,
        lat: lat,
        lon: lon,
      })
    );
    console.log("LON  : " + lon + " Lat  : " + lat );
   // console.log("Bounds on link" + JSON.stringify(bounds) +" bbox :" + feature_extent);
    console.log(" " );
  }
  // add everything to source
  doc_vector_source.addFeatures(features);
};

client.send();

map.on('click', (e) => {
  document_layer.getFeatures(e.pixel).then((clickedFeatures) => {
    if (clickedFeatures.length) {
      // Get clustered Coordinates
      const features = clickedFeatures[0].get('features');
      if (features.length > 1) {
        const extent = boundingExtent(
          features.map((r) => r.getGeometry().getCoordinates())
        );
        console.log("ex  : " + JSON.stringify(extent) );
        map.getView().fit(extent, {duration: 1000, padding: [150, 150, 150, 150]});
      } else {
       
        let point = features[0].getGeometry();
        let size = map.getSize();
        let cord = point.getCoordinates();
        map.getView().fit(point, {padding:  [150, 150, 150, 150], minResolution: 150});
      }
    }
  });
});
// Add Select click handle to map
//map.addInteraction(select);





