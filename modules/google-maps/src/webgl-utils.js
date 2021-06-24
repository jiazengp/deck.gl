/* global document */
import {Deck} from '@deck.gl/core';

/**
 * Get a new deck instance
 * @param map (google.maps.Map) - The parent Map instance
 * @param [deck] (Deck) - a previously created instances
 */
export function createDeckInstance(map, gl, deck, props) {
  if (deck) {
    if (deck.props.userData._googleMap === map) {
      return deck;
    }
    // deck instance was created for a different map
    destroyDeckInstance(deck);
  }

  const eventListeners = {
    click: null,
    dblclick: null,
    mousemove: null,
    mouseout: null
  };

  const deckProps = {
    ...props,
    useDevicePixels: true,
    // TODO: import these defaults from a single source of truth
    parameters: {
      depthMask: true,
      depthTest: true,
      blendFunc: [gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA],
      blendEquation: gl.FUNC_ADD
    },
    // userData: {
    //   isExternal: false,
    //   mapboxLayers: new Set()
    // }

    // -----
    style: {pointerEvents: 'none'},
    parent: getContainer(map, props.style),
    initialViewState: {
      longitude: 0,
      latitude: 0,
      zoom: 1
    },
    controller: false,
    userData: {
      _googleMap: map,
      _eventListeners: eventListeners
    }
  };

  if (deck) {
    deck.setProps(deckProps);
    deck.props.userData.isExternal = true;
  } else {
    // Using external gl context - do not set css size
    Object.assign(deckProps, {
      gl,
      width: false,
      height: false,
      touchAction: 'unset'
    });
    deck = new Deck(deckProps);
  }

  return deck;
}

// Create a container that will host the deck canvas and tooltip
function getContainer(map, style) {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  Object.assign(container.style, style);
  map.getDiv().appendChild(container);
  return container;
}

/**
 * Safely remove a deck instance
 * @param deck (Deck) - a previously created instances
 */
export function destroyDeckInstance(deck) {
  const {_eventListeners: eventListeners} = deck.props.userData;

  // Unregister event listeners
  for (const eventType in eventListeners) {
    eventListeners[eventType].remove();
  }

  deck.finalize();
}

/* eslint-disable max-statements */
/**
 * Get the current view state
 * @param map (google.maps.Map) - The parent Map instance
 * @param coordinateTransformer (google.maps.CoordinateTransformer) - A CoordinateTransformer instance
 */
export function getViewState(map, coordinateTransformer) {
  // The map fills the container div unless it's in fullscreen mode
  // at which point the first child of the container is promoted
  const container = map.getDiv().firstChild;
  const width = container.offsetWidth;
  const height = container.offsetHeight;

  const {
    lat: latitude,
    lng: longitude,
    heading: bearing,
    tilt: pitch,
    zoom
  } = coordinateTransformer.getCameraParams();

  return {
    width,
    height,
    bearing,
    zoom: zoom - 1,
    pitch,
    latitude,
    longitude
  };
}