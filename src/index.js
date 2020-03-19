import { PureComponent } from 'react'
import PropTypes from 'prop-types'
import GoongGeocoder from '@goongmaps/goong-geocoder'
import { FlyToInterpolator } from '@goongmaps/goong-map-react'

const VALID_POSITIONS = ['top-left', 'top-right', 'bottom-left', 'bottom-right']

class Geocoder extends PureComponent {
  geocoder = null
  cachedResult = null

  componentDidMount() {
    this.initializeGeocoder()
  }

  componentWillUnmount() {
    this.removeGeocoder()
  }

  componentDidUpdate() {
    this.removeGeocoder()
    this.initializeGeocoder()
  }

  initializeGeocoder = () => {
    const goongMap = this.getGoongMap()
    const containerNode = this.getContainerNode()
    const {
      goongApiAccessToken,
      inputValue,
      origin,
      zoom,
      placeholder,
      proximity,
      trackProximity,
      collapsed,
      clearAndBlurOnEsc,
      clearOnBlur,
      radius,
      minLength,
      limit,
      render,
      getItemValue,
      onInit,
      position
    } = this.props
    const options = {
      accessToken: goongApiAccessToken,
      origin,
      zoom,
      radius: radius,
      flyTo: true,
      placeholder,
      proximity,
      trackProximity,
      collapsed,
      clearAndBlurOnEsc,
      clearOnBlur,
      minLength,
      limit,
      marker: false
    }

    if (render && typeof render === 'function') {
      options.render = render
    }

    if (getItemValue && typeof getItemValue === 'function') {
      options.getItemValue = getItemValue
    }

    this.geocoder = new GoongGeocoder(options)
    this.subscribeEvents()

    if (containerNode) {
      containerNode.appendChild(this.geocoder.onAdd(goongMap))
    } else {
      goongMap.addControl(this.geocoder, VALID_POSITIONS.find((_position) => position === _position))
    }

    if (inputValue !== undefined && inputValue !== null) {
      this.geocoder.setInput(inputValue)
    } else if (this.cachedResult) {
      this.geocoder.setInput(this.cachedResult.place_name)
    }

    if (this.cachedResult || (inputValue !== undefined && inputValue !== null)) {
      this.showClearIcon()
    }

    onInit(this.geocoder)
  }

  showClearIcon = () => {
    // this is a hack to force clear icon to show if there is text in the input
    this.geocoder._clearEl.style.display = 'block'
  }

  getGoongMap = () => {
    const { mapRef } = this.props

    return (mapRef && mapRef.current && mapRef.current.getMap()) || null
  }

  getContainerNode = () => {
    const { containerRef } = this.props

    return (containerRef && containerRef.current) || null
  }

  subscribeEvents = () => {
    this.geocoder.on('clear', this.handleClear)
    this.geocoder.on('loading', this.handleLoading)
    this.geocoder.on('results', this.handleResults)
    this.geocoder.on('result', this.handleResult)
    this.geocoder.on('error', this.handleError)
  }

  unsubscribeEvents = () => {
    this.geocoder.off('clear', this.handleClear)
    this.geocoder.off('loading', this.handleLoading)
    this.geocoder.off('results', this.handleResults)
    this.geocoder.off('result', this.handleResult)
    this.geocoder.off('error', this.handleError)
  }

  removeGeocoder = () => {
    const goongMap = this.getGoongMap()

    this.unsubscribeEvents()

    if (goongMap && goongMap.removeControl) {
      this.getGoongMap().removeControl(this.geocoder)
    }

    this.geocoder = null
  }

  handleClear = () => {
    this.cachedResult = null
    this.props.onClear()
  }

  handleLoading = (event) => {
    this.props.onLoading(event)
  }

  handleResults = (event) => {
    this.props.onResults(event)
  }

  handleResult = (event) => {
    const { result } = event.result
    const { onViewportChange, onResult } = this.props
    const { geometry = {} } = result
    const latitude = geometry.location.lat
    const longitude = geometry.location.lng

    let zoom = this.geocoder.options.zoom

    onViewportChange({
      longitude,
      latitude,
      zoom,
      transitionInterpolator: new FlyToInterpolator(),
      transitionDuration: 3000
    })
    onResult(event)

    this.cachedResult = result
    this.geocoder._typeahead.selected = null
    this.showClearIcon()
  }

  handleError = (event) => {
    this.props.onError(event)
  }

  getGeocoder() {
    return this.geocoder
  }

  render() {
    return null
  }

  static propTypes = {
    mapRef: PropTypes.object.isRequired,
    containerRef: PropTypes.object,
    onViewportChange: PropTypes.func,
    goongApiAccessToken: PropTypes.string.isRequired,
    inputValue: PropTypes.string,
    origin: PropTypes.string,
    zoom: PropTypes.number,
    radius: PropTypes.number,
    placeholder: PropTypes.string,
    proximity: PropTypes.object,
    trackProximity: PropTypes.bool,
    collapsed: PropTypes.bool,
    clearAndBlurOnEsc: PropTypes.bool,
    clearOnBlur: PropTypes.bool,
    minLength: PropTypes.number,
    limit: PropTypes.number,
    render: PropTypes.func,
    getItemValue: PropTypes.func,
    position: PropTypes.oneOf(VALID_POSITIONS),
    onInit: PropTypes.func,
    onClear: PropTypes.func,
    onLoading: PropTypes.func,
    onResults: PropTypes.func,
    onResult: PropTypes.func,
    onError: PropTypes.func
  }

  static defaultProps = {
    onViewportChange: () => {},
    origin: 'https://rsapi.goong.io',
    zoom: 14,
    radius: 3000,
    placeholder: 'Search',
    trackProximity: true,
    collapsed: false,
    clearAndBlurOnEsc: false,
    clearOnBlur: false,
    minLength: 2,
    limit: 10,
    position: 'top-right',
    onInit: () => {},
    onClear: () => {},
    onLoading: () => {},
    onResults: () => {},
    onResult: () => {},
    onError: () => {}
  }
}

export default Geocoder
