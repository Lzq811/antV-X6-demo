import React, { Component } from 'react'
import ReactDOM from 'react-dom'

import insertCss from 'insert-css'
import { Tooltip, Button, Form, Input, InputNumber, Modal } from 'antd'
import { Graph, Node, Platform, Dom } from '@antv/x6'

import './index.less'

class Flow extends Component {
  state = {
    graph: null,
    isModalVisible: false,
    currNode: null,
    editLabel: ''
  }

  private GraphContainer!: HTMLDivElement

  private initGraph = (): void => {

    // 定义节点
    Graph.registerNode(
      'algo-node',
      {
        inherit: 'rect',
        attrs: {
          body: {
            strokeWidth: 1,
            stroke: '#108ee9',
            fill: '#fff',
            rx: 15,
            ry: 15,
          },
        },
        portMarkup: [
          {
            tagName: 'foreignObject',
            selector: 'fo',
            attrs: {
              width: 10,
              height: 10,
              x: -5,
              y: -5,
              magnet: 'true',
            },
            children: [
              {
                ns: Dom.ns.xhtml,
                tagName: 'body',
                selector: 'foBody',
                attrs: {
                  xmlns: Dom.ns.xhtml,
                },
                style: {
                  width: '100%',
                  height: '100%',
                },
                children: [
                  {
                    tagName: 'div',
                    selector: 'content',
                    style: {
                      width: '100%',
                      height: '100%',
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      true,
    )

    // 定义边
    Graph.registerConnector(
      'algo-edge',
      (source, target) => {
        const offset = 4
        const control = 80
        const v1 = { x: source.x, y: source.y + offset + control }
        const v2 = { x: target.x, y: target.y - offset - control }

        return `M ${source.x} ${source.y}
          L ${source.x} ${source.y + offset}
          C ${v1.x} ${v1.y} ${v2.x} ${v2.y} ${target.x} ${target.y - offset}
          L ${target.x} ${target.y}
          `
      },
      true,
    )

    const graph = new Graph({
      // width: 16000,
      // height: 6000,
      panning: true,
      container: this.GraphContainer,
      grid: {
        visible: true
      },
      onPortRendered(args) {
        const port:any = args.port
        const contentSelectors:any = args.contentSelectors
        const container = contentSelectors && contentSelectors.content
        if (container) {
          ReactDOM.render(
            <Tooltip title="port">
              <div className={`my-port${port.connected ? ' connected' : ''}`} />
            </Tooltip>,
            container,
          )
        }   
      },
      highlighting: {
        nodeAvailable: {
          name: 'className',
          args: {
            className: 'available',
          },
        },
        magnetAvailable: {
          name: 'className',
          args: {
            className: 'available',
          },
        },
        magnetAdsorbed: {
          name: 'className',
          args: {
            className: 'adsorbed',
          },
        },
      },
      connecting: {
        snap: true,
        allowBlank: false,
        allowLoop: false,
        highlight: true,
        sourceAnchor: {
          name: 'bottom',
          args: {
            dx: Platform.IS_SAFARI ? 5 : 0,
          },
        },
        targetAnchor: {
          name: 'center',
          args: {
            dx: Platform.IS_SAFARI ? 5 : 0,
          },
        },
        connectionPoint: 'anchor',
        connector: 'algo-edge',
        createEdge() {
          return graph.createEdge({
            attrs: {
              line: {
                strokeDasharray: '5 5',
                stroke: '#808080',
                strokeWidth: 1,
                targetMarker: {
                  name: 'block',
                  args: {
                    size: '6',
                  },
                },
              },
            },
          })
        },
        validateMagnet({ magnet }) {
          return magnet.getAttribute('port-group') !== 'in'
        },
        validateConnection({ sourceView, targetView, sourceMagnet, targetMagnet }) {
          // 只能从输出链接桩创建连接
          if (!sourceMagnet || sourceMagnet.getAttribute('port-group') === 'in') {
            return false
          }
    
          // 只能连接到输入链接桩
          if (!targetMagnet || targetMagnet.getAttribute('port-group') !== 'in') {
            return false
          }
    
          // 判断目标链接桩是否可连接
          const portId = targetMagnet.getAttribute('port')!
          const node = targetView.cell as Node
          const port = node.getPort(portId)
          if (port && port.connected) {
            return false
          }
    
          return true
        },
      },
      mousewheel: {
        enabled: true,
        modifiers: ['ctrl', 'meta'],
      }
    })

    const ports = (id):any =>  ({
      items: [
        { group: 'in', id: `${id}_in_1`, connected: true },
        { group: 'out', id: `${id}_out_1` },
        { group: 'out', id: `${id}_out_2` }
      ],
      groups: {
        in: {
          position: { name: 'top' },
          zIndex: 1,
        },
        out: {
          position: { name: 'bottom' },
          zIndex: 1,
        },
      }
    })

    let nodeList = []
    let Len = []
    let tmp = 1
    let tmpX = 0
    let tmpY = 0
    new Array(255).fill(0).forEach((item, index) => {
      if ((index * 2 + 1) === tmp) {
        tmpY += 500
        tmpX = 0
        Len.push(tmp)
        tmp = tmp * 2 + 1
      }
      nodeList.push({
        node: index,
        x: tmpX += 320,
        y: tmpY,
        width: 260,
        height: 400,
        shape: 'algo-node',
        label: `节点${index}`,
        ports: ports(index)
      })
    })

    this.setState({graph}, () => {

      graph.on('edge:connected', (args) => {
        const edge = args.edge
        const node = args.currentCell as Node
        const elem = args.currentMagnet as HTMLElement
        const portId = elem.getAttribute('port') as string
      
        // 触发 port 重新渲染
        node.setPortProp(portId, 'connected', true)
      
        // 更新连线样式
        edge.attr({
          line: {
            strokeDasharray: '',
            targetMarker: '',
          },
        })
      })

      const sourceList = []
      nodeList.forEach((item) => {
        sourceList.push(graph.addNode(item))
      })

      sourceList.forEach((item, index) => {
        if (((index * 2) + 1) < sourceList.length - 1) {
          let source = item
          let target = sourceList[(index * 2) + 1]
          graph.addEdge({
            source: { cell: source, port: nodeList[index].ports.items[1].id},
            target: { cell: target, port: nodeList[(index * 2) + 1].ports.items[0].id}
          })
        }
        if (((index * 2) + 1) < sourceList.length - 1) {
          let source = item
          let target2 = sourceList[(index * 2) + 2]
          graph.addEdge({
            source: { cell: source, port: nodeList[index].ports.items[1].id},
            target: { cell: target2, port: nodeList[(index * 2) + 2].ports.items[0].id}
          })
        }
      })

      graph.on('node:dblclick', ({ node }) => {
        this.setState({isModalVisible: true, currNode: node})
      })

      graph.on('edge:dblclick', ({ edge }) => {
        graph.removeEdge(edge)
      })

      graph.zoomToFit()
      
    })
  }

  private RefContainer = (container: HTMLDivElement) => {
    this.GraphContainer = container
  }

  private HandleAddNode = (values: any) => {
    const { graph } = this.state
    const { label, x, y } = values.form
    const nodeData = {
      node: 5,
      x,
      y,
      label,
      shape: 'algo-node',
      width: 160,
      height: 30,
      ports: {
        items: [
          { group: 'in', id: 'in1' },
          { group: 'in', id: 'in2' },
          { group: 'out', id: 'out1' },
          { group: 'out', id: 'out2' },
        ],
        groups: {
          in: {
            position: { name: 'top' },
            zIndex: 1,
          },
          out: {
            position: { name: 'bottom' },
            zIndex: 1,
          },
        },
      }
    }
    graph.addNode(nodeData)
  }

  private deleteNode = () => {
    const {graph, currNode} = this.state
    this.setState({isModalVisible: false}, () => {
      graph.removeNode(currNode)
    })
  }

  private EditLabelFinsh = (values: any) => {
    const { graph, currNode } = this.state
    let nodes = graph.getNodes()
    nodes = nodes.map((item: any) => {
      item === currNode && (item.label = values.currLabel)
      return item
    })
    this.setState({isModalVisible: false})
  }

  private handleCancel = () => {
    this.setState({isModalVisible: false})
  }

  componentDidMount () {
    this.initGraph()
  }

  componentWillUnmount () {
    this.state.graph.dispose()
  }

  render() {

    const { isModalVisible } = this.state

    const layout = {labelCol: { span: 8 }, wrapperCol: { span: 12 }}

    /* eslint-disable no-template-curly-in-string */
    const validateMessages = {
      required: '${label} is required!',
      types: {
        email: '${label} is not a valid email!',
        number: '${label} is not a valid number!',
      },
      number: {
        range: '${label} must be between ${min} and ${max}',
      },
    }
    /* eslint-enable no-template-curly-in-string */

    return <div className='Flow'>
      <div className='container'>
        <p style={{color: 'red', position: 'fixed'}}>ctrl + 鼠标滚轮 或者 meta + 鼠标滚轮 进行 缩放</p>
        <div style={{ width: '100%', height: '100%' }} ref={this.RefContainer}></div>
      </div>
      <div className='edit-box'>
        <Form {...layout} name="nest-messages" onFinish={this.HandleAddNode} validateMessages={validateMessages}>
          <Form.Item name={['form', 'label']} label="内容" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name={['form', 'x']} label="x轴坐标" rules={[{ type: 'number', min: 0, max: 800 }]}>
            <InputNumber />
          </Form.Item>
          <Form.Item name={['form', 'y']} label="y轴坐标" rules={[{ type: 'number', min: 0, max: 600 }]}>
            <InputNumber />
          </Form.Item>
          <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 8 }}>
            <Button type="primary" htmlType="submit"> 新增节点 </Button>
          </Form.Item>
        </Form>
        <Modal title="Basic Modal" visible={isModalVisible} footer={null} onCancel={this.handleCancel}>
          <Form onFinish={this.EditLabelFinsh}>
            <Form.Item label="修改内容" name='currLabel' rules={[{ required: true }]}>
              <Input placeholder='请输入要修改的内容'  />
            </Form.Item>
            <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 8 }}>
              <Button type="primary" htmlType="submit"> 修改 </Button>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <Button type="primary" danger onClick={this.deleteNode}> 删除节点 </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  }
}

insertCss(`
.x6-node [magnet="true"] {
  cursor: crosshair;
  transition: none;
}

.x6-node [magnet="true"]:hover {
  opacity: 1;
}

.x6-node [magnet="true"][port-group="in"] {
  cursor: move;
}

.my-port {
  width: 100%;
  height: 100%;
  border: 1px solid #808080;
  border-radius: 100%;
  background: #eee;
}

.my-port.connected {
  width: 0;
  height: 0;
  margin-top: 5px;
  margin-left: 1px;
  border-width: 5px 4px 0;
  border-style: solid;
  border-color: #808080 transparent transparent;
  border-radius: 0;
  background-color: transparent;
}

.x6-port-body.available {
  overflow: visible;
}

.x6-port-body.available body {
  overflow: visible;
}

.x6-port-body.available body > div::before {
  content: " ";
  float: left;
  width: 20px;
  height: 20px;
  margin-top: -5px;
  margin-left: -5px;
  border-radius: 50%;
  background-color: rgba(57, 202, 116, 0.6);
  box-sizing: border-box;
}

.x6-port-body.available body > div::after {
  content: " ";
  float: left;
  clear: both;
  width: 10px;
  height: 10px;
  margin-top: -15px;
  border-radius: 50%;
  background-color: #fff;
  border: 1px solid #39ca74;
  position: relative;
  z-index: 10;
  box-sizing: border-box;
}

.x6-port-body.adsorbed {
  overflow: visible;
}

.x6-port-body.adsorbed body {
  overflow: visible;
}

.x6-port-body.adsorbed body > div::before {
  content: " ";
  float: left;
  width: 28px;
  height: 28px;
  margin-top: -9px;
  margin-left: -9px;
  border-radius: 50%;
  background-color: rgba(57, 202, 116, 0.6);
  box-sizing: border-box;
}

.x6-port-body.adsorbed body > div::after {
  content: " ";
  float: left;
  clear: both;
  width: 10px;
  height: 10px;
  margin-top: -19px;
  border-radius: 50%;
  background-color: #fff;
  border: 1px solid #39ca74;
  position: relative;
  z-index: 10;
  box-sizing: border-box;
}
`)

export default Flow