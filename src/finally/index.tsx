import React, { Component } from 'react'

import ReactDOM from 'react-dom'

import { Graph, Shape, Node, Platform, Dom } from '@antv/x6'

import './index.less'

class Finally extends Component <any, any> {

  private GraphContainer!: HTMLDivElement

  state = {
    graph: null
  }

  private initGraph = () => {
    const graph = new Graph({
      container: this.GraphContainer,
      grid: {
        visible: true,
        size: 20
      }
    })
    this.setState({graph}, () => {
      const { graph } = this.state
      // !!! rect
      const rect = new Shape.Rect({
        x: 40,
        y: 40,
        width: 100,
        height: 40,
        attrs: {
          // 指定 rect 元素的样式  
          body: { 
            stroke: '#000', // 边框颜色
            fill: '#fff',   // 填充颜色
          },
          // 指定 text 元素的样式
          label: { 
            text: 'rect', // 文字
            fill: '#333', // 文字颜色
          },
        },
      })


      graph.addNode({
        shape: 'rect',
        x: 200,
        y: 200,
        width: 200,
        height: 400,
        label: 'hello world',
        name: {
          text: 'hello name',
          fill: 'red',
          fontSize: 20
        }
      })
    })
  }

  private RefAntvContainer = (container: HTMLDivElement) => {
    this.GraphContainer = container
  }

  componentDidMount () {
    this.initGraph()
  }

  render () {

    return <div className='finally-com'>
      <div style={{width: '1400px', height: '800px', border: '1px solid red', margin: '50px auto'}} ref={this.RefAntvContainer}></div>
    </div>
  }
}

export default Finally