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
            <div key="palleteHeader" style={{
                margin: 6, padding: 10,
                position: "absolute", width: "230px", height: "70px",
                backgroundColor: "white", zIndex: 4
            }}>
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
        allowDrop: true,  // must be true to accept drops from the Palette
        LinkDrawn: showLinkLabel,  // this DiagramEvent listener is defined below
        LinkRelinked: showLinkLabel,
        scrollsPageOnFocus: false,
    });
    myDiagram.addDiagramListener("Modified", function (e) {
        var button = document.getElementById("SaveButton");
        if (button) button.disabled = !myDiagram.isModified;
        var idx = document.title.indexOf("*");
        if (myDiagram.isModified) {
            if (idx < 0) document.title += "*";
        } else {
            if (idx >= 0) document.title = document.title.substr(0, idx);
        }
    });
    // To simplify this code we define a function for creating a context menu button:
    function makeButton(text, action, visiblePredicate) {
      return $("ContextMenuButton",
               $(go.TextBlock, text),
               { click: action },
               // don't bother with binding GraphObject.visible if there's no predicate
               visiblePredicate ? new go.Binding("visible", "", function(o, e) { return o.diagram ? visiblePredicate(o, e) : false; }).ofObject() : {});
    }
    function nodeStyle() {
        return [
            // The Node.location comes from the "loc" property of the node data,
            // converted by the Point.parse static method.
            // If the Node.location is changed, it updates the "loc" property of the node data,
            // converting back using the Point.stringify static method.
            new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
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
        return $(go.Shape,
            {
                fill: "transparent",  // changed to a color in the mouseEnter event handler
                strokeWidth: 0,  // no stroke
                width: horizontal ? NaN : 8,  // if not stretching horizontally, just 8 wide
                height: !horizontal ? NaN : 8,  // if not stretching vertically, just 8 tall
                alignment: align,  // align the port on the main Shape
                stretch: (horizontal ? go.GraphObject.Horizontal : go.GraphObject.Vertical),
                portId: name,  // declare this object to be a "port"
                fromSpot: spot,  // declare where links may connect at this port
                fromLinkable: output,  // declare whether the user may draw links from here
                toSpot: spot,  // declare where links may connect at this port
                toLinkable: input,  // declare whether the user may draw links to here
                cursor: "pointer",  // show a different cursor to indicate potential link point
                mouseEnter: function (e, port) {  // the PORT argument will be this Shape
                    if (!e.diagram.isReadOnly) port.fill = "rgba(255,0,255,0.5)";
                },
                mouseLeave: function (e, port) {
                    port.fill = "transparent";
                }
            });
    }
    function textStyle() {
        return {
            font: "bold 11pt Tahoma,Helvetica, Arial, sans-serif",
            stroke: "whitesmoke"
        }
    }
    // define the Node templates for regular nodes
    myDiagram.nodeTemplateMap.add("",  // the default category
        $(go.Node, "Table", nodeStyle(),
            // the main object is a Panel that surrounds a TextBlock with a rectangular Shape
            $(go.Panel, "Auto",
                $(go.Shape, "Rectangle",
                    { fill: "#00A9C9", strokeWidth: 0 },
                    new go.Binding("figure", "figure")),
                $(go.TextBlock, textStyle(),
                    {
                        margin: 8,
                        maxSize: new go.Size(160, NaN),
                        wrap: go.TextBlock.WrapFit,
                        editable: true
                    },
                    new go.Binding("text").makeTwoWay())
            ),
            // four named ports, one on each side:
            makePort("T", go.Spot.Top, go.Spot.TopSide, false, true),
            makePort("L", go.Spot.Left, go.Spot.LeftSide, true, true),
            makePort("R", go.Spot.Right, go.Spot.RightSide, true, true),
            makePort("B", go.Spot.Bottom, go.Spot.BottomSide, true, false)
        ));

    myDiagram.nodeTemplateMap.add("Conditional",
        $(go.Node, "Table", nodeStyle(),
            // the main object is a Panel that surrounds a TextBlock with a rectangular Shape
            $(go.Panel, "Auto",
                $(go.Shape, "Diamond",
                    { fill: "#00A9C9", strokeWidth: 0 },
                    new go.Binding("figure", "figure")),
                $(go.TextBlock, textStyle(),
                    {
                        margin: 8,
                        maxSize: new go.Size(160, NaN),
                        wrap: go.TextBlock.WrapFit,
                        editable: true
                    },
                    new go.Binding("text").makeTwoWay())
            ),
            // four named ports, one on each side:
            makePort("T", go.Spot.Top, go.Spot.Top, false, true),
            makePort("L", go.Spot.Left, go.Spot.Left, true, true),
            makePort("R", go.Spot.Right, go.Spot.Right, true, true),
            makePort("B", go.Spot.Bottom, go.Spot.Bottom, true, false)
        ));

    myDiagram.nodeTemplateMap.add("Start",
        $(go.Node, "Table", nodeStyle(),
            $(go.Panel, "Auto",
                $(go.Shape, "Circle",
                    { minSize: new go.Size(40, 40), fill: "#79C900", strokeWidth: 0 }),
                $(go.TextBlock, "Start", textStyle(),
                    new go.Binding("text"))
            ),
            // three named ports, one on each side except the top, all output only:
            makePort("L", go.Spot.Left, go.Spot.Left, true, false),
            makePort("R", go.Spot.Right, go.Spot.Right, true, false),
            makePort("B", go.Spot.Bottom, go.Spot.Bottom, true, false)
        ));

    myDiagram.nodeTemplateMap.add("End",
        $(go.Node, "Table", nodeStyle(),
            $(go.Panel, "Auto",
                $(go.Shape, "Circle",
                    { minSize: new go.Size(40, 40), fill: "#DC3C00", strokeWidth: 0 }),
                $(go.TextBlock, "End", textStyle(),
                    new go.Binding("text"))
            ),
            // three named ports, one on each side except the bottom, all input only:
            makePort("T", go.Spot.Top, go.Spot.Top, false, true),
            makePort("L", go.Spot.Left, go.Spot.Left, false, true),
            makePort("R", go.Spot.Right, go.Spot.Right, false, true)
        ));

    myDiagram.nodeTemplateMap.add("Comment",
        $(go.Node, "Auto", nodeStyle(),
            $(go.Shape, "File",
                { fill: "#EFFAB4", strokeWidth: 0 }),
            $(go.TextBlock, textStyle(),
                {
                    margin: 5,
                    maxSize: new go.Size(200, NaN),
                    wrap: go.TextBlock.WrapFit,
                    textAlign: "center",
                    editable: true,
                    font: "bold 12pt Helvetica, Arial, sans-serif",
                    stroke: '#454545'
                },
                new go.Binding("text").makeTwoWay())
            // no ports, because no links are allowed to connect with a comment
        ));


    // replace the default Link template in the linkTemplateMap
    myDiagram.linkTemplate =
        $(go.Link,  // the whole link panel
            {
                routing: go.Link.AvoidsNodes,
                curve: go.Link.JumpOver,
                corner: 5, toShortLength: 4,
                relinkableFrom: true,
                relinkableTo: true,
                reshapable: true,
                resegmentable: true,
                // mouse-overs subtly highlight links:
                mouseEnter: function (e, link) { link.findObject("HIGHLIGHT").stroke = "rgba(30,144,255,0.2)"; },
                mouseLeave: function (e, link) { link.findObject("HIGHLIGHT").stroke = "transparent"; },
                selectionAdorned: false
            },
            new go.Binding("points").makeTwoWay(),
            $(go.Shape,  // the highlight shape, normally transparent
                { isPanelMain: true, strokeWidth: 8, stroke: "transparent", name: "HIGHLIGHT" }),
            $(go.Shape,  // the link path shape
                { isPanelMain: true, stroke: "gray", strokeWidth: 2 },
                new go.Binding("stroke", "isSelected", function (sel) { return sel ? "dodgerblue" : "gray"; }).ofObject()),
            $(go.Shape,  // the arrowhead
                { toArrow: "standard", strokeWidth: 0, fill: "gray" }),
            $(go.Panel, "Auto",  // the link label, normally not visible
                { visible: false, name: "LABEL", segmentIndex: 2, segmentFraction: 0.5 },
                new go.Binding("visible", "visible").makeTwoWay(),
                $(go.Shape, "RoundedRectangle",  // the label shape
                    { fill: "#F8F8F8", strokeWidth: 0 }),
                $(go.TextBlock, "Yes",  // the label
                    {
                        textAlign: "center",
                        font: "10pt helvetica, arial, sans-serif",
                        stroke: "#333333",
                        editable: true
                    },
                    new go.Binding("text").makeTwoWay())
            )
        );

    function showLinkLabel(e) {
        var label = e.subject.findObject("LABEL");
        if (label !== null) label.visible = (e.subject.fromNode.data.category === "Conditional");
    }

    myDiagram.toolManager.panningTool.isEnabled = false;
    myDiagram.toolManager.mouseWheelBehavior = ToolManager.WheelScroll;

    //load();  // load an initial diagram from some JSON text

    // initialize the Palette that is on the left side of the page
    const myPalette =
        $(go.Palette, "myPaletteDiv",  // must name or refer to the DIV HTML element
            {
                scrollsPageOnFocus: false,
                nodeTemplateMap: myDiagram.nodeTemplateMap,  // share the templates used by myDiagram
                model: new go.GraphLinksModel([  // specify the contents of the Palette
                    { category: "Comment", text: "Comment1" },
                    { category: "Comment", text: "Comment2" },
                    { category: "Start", text: "Start" },
                    { category: "Comment", text: "Comment" },
                    { text: "Step" },
                    { category: "Conditional", text: "Condition?" },
                    { category: "End", text: "End" },
                ])
            });
    //   } // end init


    //   // Show the diagram's model in JSON format that the user may edit
    //   function save() {
    //     document.getElementById("mySavedModel").value = myDiagram.model.toJson();
    //     myDiagram.isModified = false;
    //   }
    //   function load() {
    //     myDiagram.model = go.Model.fromJson(document.getElementById("mySavedModel").value);
    //   }
    // myDiagram.nodeTemplate = $(
    //     go.Node,
    //     'Auto',
    //     {
    //         selectionChanged: node => this.nodeSelectionHandler(node.key, node.isSelected)
    //     },
    //     $(go.Shape, 'RoundedRectangle', { strokeWidth: 1 }, new go.Binding('fill', 'color')),
    //     $(go.TextBlock, { margin: 8, editable: true }, new go.Binding('text', 'label')),
    // );
    //myDiagram.model = go.Model.fromJson(this.state.model);

    return myDiagram;
}

// modelChangeHandler(event) {
//     switch (event.eventType) {
//         case ModelChangeEventType.Remove:
//             if (event.nodeData) {
//                 this.removeNode(event.nodeData.key);
//             }
//             if (event.linkData) {
//                 this.removeLink(event.linkData);
//             }
//             break;
//         default:
//             break;
//     }
// }

// addNode() {
//     const newNodeId = 'node' + this.nodeId;
//     const linksToAdd = this.state.selectedNodeKeys.map(parent => {
//         return { from: parent, to: newNodeId };
//     });
//     this.setState({
//         ...this.state,
//         model: {
//             ...this.state.model,
//             nodeDataArray: [
//                 ...this.state.model.nodeDataArray,
//                 { key: newNodeId, label: newNodeId, color: getRandomColor() }
//             ],
//             linkDataArray:
//                 linksToAdd.length > 0
//                     ? [...this.state.model.linkDataArray].concat(linksToAdd)
//                     : [...this.state.model.linkDataArray]
//         }
//     });
//     this.nodeId += 1;
// }

// removeNode(nodeKey) {
//     const nodeToRemoveIndex = this.state.model.nodeDataArray.findIndex(node => node.key === nodeKey);
//     if (nodeToRemoveIndex === -1) {
//         return;
//     }
//     this.setState({
//         ...this.state,
//         model: {
//             ...this.state.model,
//             nodeDataArray: [
//                 ...this.state.model.nodeDataArray.slice(0, nodeToRemoveIndex),
//                 ...this.state.model.nodeDataArray.slice(nodeToRemoveIndex + 1)
//             ]
//         }
//     });
// }

// removeLink(linKToRemove) {
//     const linkToRemoveIndex = this.state.model.linkDataArray.findIndex(
//         link => link.from === linKToRemove.from && link.to === linKToRemove.to
//     );
//     if (linkToRemoveIndex === -1) {
//         return;
//     }
//     return {
//         ...this.state,
//         model: {
//             ...this.state.model,
//             linkDataArray: [
//                 ...this.state.model.linkDataArray.slice(0, linkToRemoveIndex),
//                 ...this.state.model.linkDataArray.slice(linkToRemoveIndex + 1)
//             ]
//         }
//     };
// }

// updateNodeText(nodeKey, text) {
//     const nodeToUpdateIndex = this.state.model.nodeDataArray.findIndex(node => node.key === nodeKey);
//     if (nodeToUpdateIndex === -1) {
//         return;
//     }
//     this.setState({
//         ...this.state,
//         model: {
//             ...this.state.model,
//             nodeDataArray: [
//                 ...this.state.model.nodeDataArray.slice(0, nodeToUpdateIndex),
//                 {
//                     ...this.state.model.nodeDataArray[nodeToUpdateIndex],
//                     label: text
//                 },
//                 ...this.state.model.nodeDataArray.slice(nodeToUpdateIndex + 1)
//             ]
//         }
//     });
// }

// nodeSelectionHandler(nodeKey, isSelected) {
//     if (isSelected) {
//         this.setState({
//             ...this.state,
//             selectedNodeKeys: [...this.state.selectedNodeKeys, nodeKey]
//         });
//     } else {
//         const nodeIndexToRemove = this.state.selectedNodeKeys.findIndex(key => key === nodeKey);
//         if (nodeIndexToRemove === -1) {
//             return;
//         }
//         this.setState({
//             ...this.state,
//             selectedNodeKeys: [
//                 ...this.state.selectedNodeKeys.slice(0, nodeIndexToRemove),
//                 ...this.state.selectedNodeKeys.slice(nodeIndexToRemove + 1)
//             ]
//         });
//     }
// }

// onTextEdited(e) {
//     const tb = e.subject;
//     if (tb === null) {
//         return;
//     }
//     const node = tb.part;
//     if (node instanceof go.Node) {
//         this.updateNodeText(node.key, tb.text);
//     }
// }
}

export default MyDiagram;
