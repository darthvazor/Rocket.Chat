import { Blaze } from 'meteor/blaze';
import { HTML } from 'meteor/htmljs';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';

export const createTemplateForComponent = async (
	component,
	// eslint-disable-next-line new-cap
	renderContainerView = () => HTML.DIV(),
	url,
) => {
	const name = component.displayName || component.name;

	if (!name) {
		throw new Error('the component must have a name');
	}

	if (Template[name]) {
		return name;
	}

	const template = new Blaze.Template(name, renderContainerView);

	const React = await import('react');
	const ReactDOM = await import('react-dom');
	const { MeteorProvider } = await import('./providers/MeteorProvider');

	function TemplateComponent() {
		return React.createElement(component);
	}

	template.onRendered(() => {
		Template.instance().autorun((computation) => {
			if (computation.firstRun) {
				Template.instance().container = Template.instance().firstNode;
			}

			ReactDOM.render(
				React.createElement(MeteorProvider, {
					children: React.createElement(TemplateComponent),
				}), Template.instance().firstNode);
		});

		url && Template.instance().autorun(() => {
			const routeName = FlowRouter.getRouteName();
			if (routeName !== url) {
				ReactDOM.unmountComponentAtNode(Template.instance().container);
			}
		});
	});

	template.onDestroyed(() => {
		if (Template.instance().container) {
			ReactDOM.unmountComponentAtNode(Template.instance().container);
		}
	});

	Template[name] = template;

	return name;
};
