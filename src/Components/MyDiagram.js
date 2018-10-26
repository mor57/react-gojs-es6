import React from 'react';
import * as go from 'gojs';
import { ToolManager, Diagram } from 'gojs';
import { GojsDiagram, ModelChangeEventType } from 'react-gojs';
import DiagramButtons from './DiagramButtons';
import DiagramPalette from './DiagramPalette';
import './MyDiagram.css';
import { getRandomColor } from '../Helpers/ColorHelper';
import SelectionDetails from './SelectionDetails';

class MyDiagram extends React.Component {
    nodeId = 0;

    constructor(props) {
        super(props);

        this.state = {
            selectedNodeKeys: [],
            model: {
                nodeDataArray: [],
                linkDataArray: []
            }
        };
    }

    render() {
        return [
            // <DiagramButtons
            //     key="diagramButtons"
            //     onInit={this.initModelHandler}
            //     onUpdateColor={this.updateColorHandler}
            //     onAddNode={this.addNode}
            // />,
            // <SelectionDetails key="selectionDetails" className="SelectionDetails" selectedNodes={this.state.selectedNodeKeys} />,
            <div
                key="palleteHeader"
                style={{
                    margin: 6,
                    padding: 10,
                    position: 'absolute',
                    width: '230px',
                    height: '70px',
                    backgroundColor: 'white',
                    zIndex: 4
                }}
            >
                Drag&drop item from palette to diagram
            </div>,
            <DiagramPalette
                key="diagramPalette"
                onInit={this.initModelHandler}
                onUpdateColor={this.updateColorHandler}
                onAddNode={this.addNode}
            />,
            <GojsDiagram
                key="gojsDiagram"
                diagramId="myDiagramDiv"
                model={this.state.model}
                createDiagram={this.createDiagram}
                className="myDiagram"
                onModelChange={this.modelChangeHandler}
            />
        ];
    }

    initModelHandler() {
        this.setState({
            ...this.state,
            model: {
                // nodeDataArray: [
                //     { key: 'Alpha', label: 'Alpha', color: 'lightblue' },
                //     { key: 'Beta', label: 'Beta', color: 'orange' },
                //     { key: 'Gamma', label: 'Gamma', color: 'lightgreen' },
                //     { key: 'Delta', label: 'Delta', color: 'pink' },
                //     { key: 'Omega', label: 'Omega', color: 'grey' }
                // ],
                // linkDataArray: [
                //     { from: 'Alpha', to: 'Beta' },
                //     { from: 'Alpha', to: 'Gamma' },
                //     { from: 'Beta', to: 'Delta' },
                //     { from: 'Gamma', to: 'Omega' }
                // ]
            }
        });
    }

    // updateColorHandler() {
    //     const updatedNodes = this.state.model.nodeDataArray.map(node => {
    //         return {
    //             ...node,
    //             color: getRandomColor()
    //         };
    //     });

    //     this.setState({
    //         ...this.state,
    //         model: {
    //             ...this.state.model,
    //             nodeDataArray: updatedNodes
    //         }
    //     });
    // }

    createDiagram(diagramId) {
        const $ = go.GraphObject.make;

        const myDiagram = $(go.Diagram, diagramId, {
            // initialContentAlignment: go.Spot.Center,
            // layout: $(go.TreeLayout, {
            //     angle: 0,
            //     arrangement: go.TreeLayout.ArrangementVertical,
            //     treeStyle: go.TreeLayout.StyleLayered
            // }),
            // isReadOnly: false,
            // allowHorizontalScroll: true,
            // allowVerticalScroll: true,
            // allowZoom: false,
            // allowSelect: true,
            // autoScale: Diagram.Uniform,
            // contentAlignment: go.Spot.Center,
            // TextEdited: this.onTextEdited
            initialContentAlignment: go.Spot.Center,
            allowDrop: true, // must be true to accept drops from the Palette
            LinkDrawn: showLinkLabel, // this DiagramEvent listener is defined below
            LinkRelinked: showLinkLabel,
            scrollsPageOnFocus: false
        });
        myDiagram.addDiagramListener('Modified', function(e) {
            var button = document.getElementById('SaveButton');
            if (button) button.disabled = !myDiagram.isModified;
            var idx = document.title.indexOf('*');
            if (myDiagram.isModified) {
                if (idx < 0) document.title += '*';
            } else {
                if (idx >= 0) document.title = document.title.substr(0, idx);
            }
        });
        // To simplify this code we define a function for creating a context menu button:
        function makeButton(text, action, visiblePredicate) {
            return $(
                'ContextMenuButton',
                $(go.TextBlock, text),
                { click: action },
                // don't bother with binding GraphObject.visible if there's no predicate
                visiblePredicate
                    ? new go.Binding('visible', '', function(o, e) {
                          return o.diagram ? visiblePredicate(o, e) : false;
                      }).ofObject()
                    : {}
            );
        }
        function nodeStyle() {
            return [
                // The Node.location comes from the "loc" property of the node data,
                // converted by the Point.parse static method.
                // If the Node.location is changed, it updates the "loc" property of the node data,
                // converting back using the Point.stringify static method.
                new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
                {
                    // the Node.location is at the center of each node
                    locationSpot: go.Spot.Center
                }
            ];
        }
        function makePort(name, align, spot, output, input) {
            var horizontal = align.equals(go.Spot.Top) || align.equals(go.Spot.Bottom);
            // the port is basically just a transparent rectangle that stretches along the side of the node,
            // and becomes colored when the mouse passes over it
            return $(go.Shape, {
                fill: 'red', // changed to a color in the mouseEnter event handler
                strokeWidth: 0, // no stroke
                width: 8, // horizontal ? NaN : 8, // if not stretching horizontally, just 8 wide
                height: 8, // !horizontal ? NaN : 8, // if not stretching vertically, just 8 tall
                alignment: align, // align the port on the main Shape
                stretch: horizontal ? go.GraphObject.Horizontal : go.GraphObject.Vertical,
                portId: name, // declare this object to be a "port"
                fromSpot: spot, // declare where links may connect at this port
                fromLinkable: output, // declare whether the user may draw links from here
                toSpot: spot, // declare where links may connect at this port
                toLinkable: input, // declare whether the user may draw links to here
                cursor: 'pointer', // show a different cursor to indicate potential link point
                mouseEnter: function(e, port) {
                    // the PORT argument will be this Shape
                    //if (!e.diagram.isReadOnly) port.fill = 'rgba(255,0,255,0.5)';
                },
                mouseLeave: function(e, port) {
                    // port.fill = 'transparent';
                }
            });
            // return $(go.Shape, {
            //     stroke: null,
            //     strokeWidth: 0,
            //     desiredSize: portSize,
            //     margin: new go.Margin(0, 1),
            //     width: 8
            // });
        }
        function textStyle() {
            return {
                font: 'bold 11pt Tahoma,Helvetica, Arial, sans-serif',
                stroke: 'whitesmoke'
            };
        }
        // define the Node templates for regular nodes
        // myDiagram.nodeTemplateMap.add(
        //     '', // the default category

        // );

        myDiagram.nodeTemplateMap.add(
            'Conditional',
            $(
                go.Node,
                'Table',
                nodeStyle(),
                // the main object is a Panel that surrounds a TextBlock with a rectangular Shape
                $(
                    go.Panel,
                    'Auto',
                    $(go.Shape, 'Diamond', { fill: '#00A9C9', strokeWidth: 0 }, new go.Binding('figure', 'figure')),
                    $(
                        go.TextBlock,
                        textStyle(),
                        {
                            margin: 8,
                            maxSize: new go.Size(160, NaN),
                            wrap: go.TextBlock.WrapFit,
                            editable: true
                        },
                        new go.Binding('text').makeTwoWay()
                    )
                ),
                // four named ports, one on each side:
                makePort('T1', go.Spot.Top, go.Spot.Top, false, true),
                makePort('T2', go.Spot.Top, go.Spot.Top, false, true),

                makePort('L', go.Spot.Left, go.Spot.Left, true, true),
                makePort('R', go.Spot.Right, go.Spot.Right, true, true),
                makePort('B', go.Spot.Bottom, go.Spot.Bottom, true, false)
            )
        );
        var portSize = new go.Size(8, 8);

        myDiagram.nodeTemplateMap.add(
            'Start',
            $(
                go.Node,
                'Table',
                nodeStyle(),
                $(
                    go.Panel,
                    'Auto',
                    $(go.Shape, 'Circle', { minSize: new go.Size(40, 40), fill: '#79C900', strokeWidth: 0 }),
                    $(go.TextBlock, 'Start', textStyle(), new go.Binding('text'))
                ),
                // three named ports, one on each side except the top, all output only:
                makePort('L', go.Spot.Left, go.Spot.Left, true, false),
                makePort('R', go.Spot.Right, go.Spot.Right, true, false),
                makePort('B', go.Spot.Bottom, go.Spot.Bottom, true, false)
            )
        );

        myDiagram.nodeTemplateMap.add(
            'End',
            $(
                go.Node,
                'Table',
                nodeStyle(),
                $(
                    go.Panel,
                    'Auto',
                    $(go.Shape, 'Circle', { minSize: new go.Size(40, 40), fill: '#DC3C00', strokeWidth: 0 }),
                    $(go.TextBlock, 'End', textStyle(), new go.Binding('text'))
                ),
                // three named ports, one on each side except the bottom, all input only:
                makePort('T', go.Spot.Top, go.Spot.Top, false, true),
                makePort('L', go.Spot.Left, go.Spot.Left, false, true),
                makePort('R', go.Spot.Right, go.Spot.Right, false, true)
            )
        );

        myDiagram.nodeTemplateMap.add(
            'Comment',
            $(
                go.Node,
                'Auto',
                nodeStyle(),
                $(go.Shape, 'File', { fill: '#EFFAB4', strokeWidth: 0 }),
                $(
                    go.TextBlock,
                    textStyle(),
                    {
                        margin: 5,
                        maxSize: new go.Size(200, NaN),
                        wrap: go.TextBlock.WrapFit,
                        textAlign: 'center',
                        editable: true,
                        font: 'bold 12pt Helvetica, Arial, sans-serif',
                        stroke: '#454545'
                    },
                    new go.Binding('text').makeTwoWay()
                )
                // no ports, because no links are allowed to connect with a comment
            )
        );
        myDiagram.nodeTemplateMap.add(
            '',
            $(
                go.Node,
                'Table',
                {
                    locationObjectName: 'BODY',
                    locationSpot: go.Spot.Center,
                    selectionObjectName: 'BODY'
                },
                new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
                // the body
                $(
                    go.Panel,
                    'Auto',
                    {
                        row: 1,
                        column: 1,
                        name: 'BODY',
                        stretch: go.GraphObject.Fill
                    },
                    $(go.Shape, 'Rectangle', {
                        fill: '#AC193D',
                        stroke: null,
                        strokeWidth: 0,
                        minSize: new go.Size(56, 56)
                    }),
                    $(
                        go.TextBlock,
                        {
                            margin: 10,
                            textAlign: 'center',
                            font: '14px  Tahoma',
                            stroke: 'white',
                            editable: true
                        },
                        new go.Binding('text', 'text').makeTwoWay()
                    )
                ),
                $(go.Panel, 'Vertical', new go.Binding('itemArray', 'leftArray'), {
                    row: 1,
                    column: 0,
                    itemTemplate: $(
                        go.Panel,
                        {
                            _side: 'left', // internal property to make it easier to tell which side it's on
                            fromSpot: go.Spot.Left,
                            toSpot: go.Spot.Left,
                            fromLinkable: true,
                            toLinkable: true,
                            cursor: 'pointer'
                        },
                        new go.Binding('portId', 'portId'),
                        $(
                            go.Shape,
                            'Rectangle',
                            {
                                stroke: null,
                                strokeWidth: 0,
                                desiredSize: portSize,
                                margin: new go.Margin(1, 0)
                            },
                            new go.Binding('fill', 'portColor')
                        )
                    )
                }),
                $(go.Panel, 'Horizontal', new go.Binding('itemArray', 'topArray'), {
                    row: 0,
                    column: 1,
                    itemTemplate: $(
                        go.Panel,
                        {
                            _side: 'top',
                            fromSpot: go.Spot.Top,
                            toSpot: go.Spot.Top,
                            fromLinkable: true,
                            toLinkable: true,
                            cursor: 'pointer'
                        },
                        new go.Binding('portId', 'portId'),
                        $(
                            go.Shape,
                            'Rectangle',
                            {
                                stroke: null,
                                strokeWidth: 0,
                                desiredSize: portSize,
                                margin: new go.Margin(0, 1)
                            },
                            new go.Binding('fill', 'portColor')
                        )
                    )
                }),
                $(go.Panel, 'Vertical', new go.Binding('itemArray', 'rightArray'), {
                    row: 1,
                    column: 2,
                    itemTemplate: $(
                        go.Panel,
                        {
                            _side: 'right',
                            fromSpot: go.Spot.Right,
                            toSpot: go.Spot.Right,
                            fromLinkable: true,
                            toLinkable: true,
                            cursor: 'pointer'
                        },
                        new go.Binding('portId', 'portId'),
                        $(
                            go.Shape,
                            'Rectangle',
                            {
                                stroke: null,
                                strokeWidth: 0,
                                desiredSize: portSize,
                                margin: new go.Margin(1, 0)
                            },
                            new go.Binding('fill', 'portColor')
                        )
                    ) // end itemTemplate
                }), // end Vertical Panel
                // the Panel holding the bottom port elements, which are themselves Panels,
                // created for each item in the itemArray, bound to data.bottomArray
                $(go.Panel, 'Horizontal', new go.Binding('itemArray', 'bottomArray'), {
                    row: 2,
                    column: 1,
                    itemTemplate: $(
                        go.Panel,
                        {
                            _side: 'bottom',
                            fromSpot: go.Spot.Bottom,
                            toSpot: go.Spot.Bottom,
                            fromLinkable: true,
                            toLinkable: true,
                            cursor: 'pointer'
                        },
                        new go.Binding('portId', 'portId'),
                        $(
                            go.Shape,
                            'Rectangle',
                            {
                                stroke: null,
                                strokeWidth: 0,
                                desiredSize: portSize,
                                margin: new go.Margin(0, 1)
                            },
                            new go.Binding('fill', 'portColor')
                        )
                    )
                })
            )
        );

        // myDiagram.linkTemplate = $(
        //     go.Link, // the whole link panel
        //     {
        //         routing: go.Link.AvoidsNodes,
        //         curve: go.Link.JumpOver,
        //         corner: 5,
        //         toShortLength: 4,
        //         relinkableFrom: true,
        //         relinkableTo: true,
        //         reshapable: true,
        //         resegmentable: true,
        //         // mouse-overs subtly highlight links:
        //         mouseEnter: function(e, link) {
        //             link.findObject('HIGHLIGHT').stroke = 'rgba(30,144,255,0.2)';
        //         },
        //         mouseLeave: function(e, link) {
        //             link.findObject('HIGHLIGHT').stroke = 'transparent';
        //         },
        //         selectionAdorned: false
        //     },
        //     new go.Binding('points').makeTwoWay(),
        //     $(
        //         go.Shape, // the highlight shape, normally transparent
        //         { isPanelMain: true, strokeWidth: 8, stroke: 'transparent', name: 'HIGHLIGHT' }
        //     ),
        //     $(
        //         go.Shape, // the link path shape
        //         { isPanelMain: true, stroke: 'gray', strokeWidth: 2 },
        //         new go.Binding('stroke', 'isSelected', function(sel) {
        //             return sel ? 'dodgerblue' : 'gray';
        //         }).ofObject()
        //     ),
        //     $(
        //         go.Shape, // the arrowhead
        //         { toArrow: 'standard', strokeWidth: 0, fill: 'gray' }
        //     ),
        //     $(
        //         go.Panel,
        //         'Auto', // the link label, normally not visible
        //         { visible: false, name: 'LABEL', segmentIndex: 2, segmentFraction: 0.5 },
        //         new go.Binding('visible', 'visible').makeTwoWay(),
        //         $(
        //             go.Shape,
        //             'RoundedRectangle', // the label shape
        //             { fill: '#F8F8F8', strokeWidth: 0 }
        //         ),
        //         $(
        //             go.TextBlock,
        //             'Yes', // the label
        //             {
        //                 textAlign: 'center',
        //                 font: '10pt helvetica, arial, sans-serif',
        //                 stroke: '#333333',
        //                 editable: true
        //             },
        //             new go.Binding('text').makeTwoWay()
        //         )
        //     )
        // );

        function showLinkLabel(e) {
            var label = e.subject.findObject('LABEL');
            if (label !== null) label.visible = e.subject.fromNode.data.category === 'Conditional';
        }

        myDiagram.toolManager.panningTool.isEnabled = false;
        myDiagram.toolManager.mouseWheelBehavior = ToolManager.WheelScroll;

        //load();  // load an initial diagram from some JSON text

        // initialize the Palette that is on the left side of the page
        const myPalette = $(
            go.Palette,
            'myPaletteDiv', // must name or refer to the DIV HTML element
            {
                scrollsPageOnFocus: false,
                nodeTemplateMap: myDiagram.nodeTemplateMap, // share the templates used by myDiagram
                model: new go.GraphLinksModel([
                    { category: 'Comment', text: 'BB' },
                    { category: 'Comment', text: 'BB' },

                    {
                        category: 'Comment',
                        text: 'Comment1',
                        key: 'Comment',
                        name: 'unti',
                        topArray: [{ portId: 'p1', portColor: 'red' }]
                    },
                    { category: 'Start', text: 'Start', topArray: [{ portId: 'p1', portColor: 'red' }] },
                    {
                        text: 'Step',
                        topArray: [{ portId: 'p1', portColor: 'red' }],
                        leftArray: [{ portId: 'p2', portColor: 'red' }],
                        rightArray: [{ portId: 'p31', portColor: 'red' }, { portId: 'p32', portColor: 'red' }],
                        bottomArray: [{ portId: 'p4', portColor: 'red' }]
                    },
                    { category: 'Conditional', text: 'Condition?' },
                    { category: 'End', text: 'End' }
                ])
            }
        );

        class CustomLink {
            constructor() {
                go.Link.call(this);
            }
            findSidePortIndexAndCount(node, port) {
                var nodedata = node.data;
                if (nodedata !== null) {
                    var portdata = port.data;
                    var side = port._side;
                    var arr = nodedata[side + 'Array'];
                    var len = arr.length;
                    for (var i = 0; i < len; i++) {
                        if (arr[i] === portdata) return [i, len];
                    }
                }
                return [-1, len];
            }
            /** @override */
            computeEndSegmentLength(node, port, spot, from) {
                console.info(this.node, this.port, this.spot, this.from);
                var esl = go.Link.prototype.computeEndSegmentLength.call(this, node, port, spot, from);
                var other = this.getOtherPort(port);
                if (port !== null && other !== null) {
                    var thispt = port.getDocumentPoint(this.computeSpot(from));
                    var otherpt = other.getDocumentPoint(this.computeSpot(!from));
                    if (Math.abs(thispt.x - otherpt.x) > 20 || Math.abs(thispt.y - otherpt.y) > 20) {
                        var info = this.findSidePortIndexAndCount(node, port);
                        var idx = info[0];
                        var count = info[1];
                        if (port._side == 'top' || port._side == 'bottom') {
                            if (otherpt.x < thispt.x) {
                                return esl + 4 + idx * 8;
                            } else {
                                return esl + (count - idx - 1) * 8;
                            }
                        } else {
                            // left or right
                            if (otherpt.y < thispt.y) {
                                return esl + 4 + idx * 8;
                            } else {
                                return esl + (count - idx - 1) * 8;
                            }
                        }
                    }
                }
                return esl;
            }
            /** @override */
            hasCurviness() {
                if (isNaN(this.curviness)) return true;
                return go.Link.prototype.hasCurviness.call(this);
            }
            /** @override */
            computeCurviness() {
                if (isNaN(this.curviness)) {
                    var fromnode = this.fromNode;
                    var fromport = this.fromPort;
                    var fromspot = this.computeSpot(true);
                    var frompt = fromport.getDocumentPoint(fromspot);
                    var tonode = this.toNode;
                    var toport = this.toPort;
                    var tospot = this.computeSpot(false);
                    var topt = toport.getDocumentPoint(tospot);
                    if (Math.abs(frompt.x - topt.x) > 20 || Math.abs(frompt.y - topt.y) > 20) {
                        if (
                            (fromspot.equals(go.Spot.Left) || fromspot.equals(go.Spot.Right)) &&
                            (tospot.equals(go.Spot.Left) || tospot.equals(go.Spot.Right))
                        ) {
                            var fromseglen = this.computeEndSegmentLength(fromnode, fromport, fromspot, true);
                            var toseglen = this.computeEndSegmentLength(tonode, toport, tospot, false);
                            var c = (fromseglen - toseglen) / 2;
                            if (frompt.x + fromseglen >= topt.x - toseglen) {
                                if (frompt.y < topt.y) return c;
                                if (frompt.y > topt.y) return -c;
                            }
                        } else if (
                            (fromspot.equals(go.Spot.Top) || fromspot.equals(go.Spot.Bottom)) &&
                            (tospot.equals(go.Spot.Top) || tospot.equals(go.Spot.Bottom))
                        ) {
                            var fromseglen = this.computeEndSegmentLength(fromnode, fromport, fromspot, true);
                            var toseglen = this.computeEndSegmentLength(tonode, toport, tospot, false);
                            var c = (fromseglen - toseglen) / 2;
                            if (frompt.x + fromseglen >= topt.x - toseglen) {
                                if (frompt.y < topt.y) return c;
                                if (frompt.y > topt.y) return -c;
                            }
                        }
                    }
                }
                return go.Link.prototype.computeCurviness.call(this);
            }
        }
        go.Diagram.inherit(CustomLink, go.Link);
        // end CustomLink class

        // end CustomLink class
        myDiagram.linkTemplate = $(
            CustomLink, // defined below
            {
                routing: go.Link.AvoidsNodes,
                corner: 4,
                curve: go.Link.JumpGap,
                reshapable: true,
                resegmentable: true,
                relinkableFrom: true,
                relinkableTo: true
            },
            new go.Binding('points').makeTwoWay(),
            $(go.Shape, { stroke: '#2F4F4F', strokeWidth: 2 })
        );

        return myDiagram;
    }
}

export default MyDiagram;
