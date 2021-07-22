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
      }
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
      
      graph.addNode({
        node: 1,
        x: 380,
        y: 180,
        width: 160,
        height: 30,
        shape: 'algo-node',
        label: '归一化',
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
        },
      })
      
      const source = graph.addNode({
        node: 2,
        x: 200,
        y: 50,
        width: 160,
        height: 30,
        shape: 'algo-node',
        label: 'SQL',
        ports: {
          items: [
            { group: 'in', id: 'in1' },
            { group: 'in', id: 'in2' },
            { group: 'out', id: 'out1' },
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
        },
      })
      
      const target = graph.addNode({
        node: 3,
        x: 120,
        y: 260,
        width: 160,
        height: 30,
        shape: 'algo-node',
        label: '序列化',
        ports: {
          items: [
            { group: 'in', id: 'in1', connected: true },
            { group: 'in', id: 'in2' },
            { group: 'out', id: 'out1' },
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
        },
      })
      
      graph.addNode({
        node: 4,
        x: 420,
        y: 260,
        width: 160,
        height: 30,
        shape: 'algo-node',
        label: '序列化2',
        ports: {
          items: [
            { group: 'in', id: 'in1' },
            { group: 'in', id: 'in2' },
            { group: 'out', id: 'out1' },
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
        },
      })
      
      graph.addEdge({
        source: { cell: source, port: 'out1' },
        target: { cell: target, port: 'in1' },
        attrs: {
          line: {
            stroke: '#808080',
            strokeWidth: 1,
            targetMarker: '',
          },
        },
      })

      graph.on('node:dblclick', ({ node }) => {
        this.setState({isModalVisible: true, currNode: node})
      })

      graph.on('edge:dblclick', ({ edge }) => {
        graph.removeEdge(edge)
      })
      
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
      <div ref={this.RefContainer} className='container'></div>
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