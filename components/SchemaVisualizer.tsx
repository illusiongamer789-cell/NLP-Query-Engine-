
import React, { useEffect, useRef } from 'react';
import type { Schema } from '../types';

declare const d3: any;

interface SchemaVisualizerProps {
  schema: Schema;
}

export const SchemaVisualizer: React.FC<SchemaVisualizerProps> = ({ schema }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!schema || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const width = svgRef.current.parentElement?.clientWidth || 800;
    const height = 400;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const nodes = schema.tables.map(t => ({ id: t.name, ...t }));
    const links = schema.relationships.map(r => ({ ...r }));

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(40));

    const link = svg.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 2);

    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(drag(simulation));

    node.append('circle')
      .attr('r', 25)
      .attr('class', 'fill-primary-500 stroke-primary-700 dark:fill-primary-600 dark:stroke-primary-400')
      .attr('stroke-width', 2);

    node.append('text')
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('class', 'fill-white font-bold text-xs')
      .text((d: any) => d.id.substring(0, 3));
      
    const tooltip = d3.select('body').append('div')
        .attr('class', 'd3-tooltip absolute p-2 text-xs bg-gray-900 text-white rounded-md shadow-lg pointer-events-none opacity-0 transition-opacity')
        .style('z-index', 100);

    node.on('mouseover', (event: MouseEvent, d: any) => {
        tooltip.transition().duration(200).style('opacity', .9);
        let tooltipHtml = `<div class="font-bold text-base mb-1">${d.id}</div>`;
        d.columns.forEach((col: any) => {
             tooltipHtml += `<div class="font-mono text-xs ${col.isPrimaryKey ? 'text-yellow-300' : ''}">${col.name}: <span class="text-gray-400">${col.type}</span></div>`;
        });
        tooltip.html(tooltipHtml)
            .style('left', (event.pageX + 15) + 'px')
            .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', () => {
        tooltip.transition().duration(500).style('opacity', 0);
    });


    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
      tooltip.remove();
    };

  }, [schema]);

  const drag = (simulation: any) => {
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    return d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended);
  };

  return <svg ref={svgRef} className="w-full h-auto"></svg>;
};
