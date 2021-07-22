import React, { Component } from 'react'

import { Graph } from '@antv/x6'

import './index.less'

class AntV extends Component {

  state = {
    graph: null
  }

  initGraph = () => {
    const graph = new Graph({
      container: document.getElementById('container'),
      grid: true
    })
    this.setState({graph}, () => {
      this.initNode()
    })
  }

  initNode = () => { // 初始化带链接桩的node节点
    const { graph } = this.state
    const tmpNode = {
      x: 240,
      y: 60,
      width: 100,
      height: 180,
      attrs: {
        body: {
          fill: '#f5f5f5',
          stroke: '#d9d9d9',
          strokeWidth: 1,
        },
      },
      label: 'hello',
      ports: {
        groups: {
          group1: {
            attrs: {
              circle: {
                r: 6,
                magnet: true,
                stroke: '#31d0c6',
                fill: '#fff',
                strokeWidth: 2,
              },
            },
          },
        },
        items: [
          { id: 'port1', group: 'group1' },
          { id: 'port2', group: 'group1' },
        ],
      },
    }
    graph.addNode(tmpNode)
  }

  componentDidMount () {
    this.initGraph()
  }

  render () {

    return <div className='Antv'>
      <div id='container'></div>
    </div>
  }
}

export default AntV