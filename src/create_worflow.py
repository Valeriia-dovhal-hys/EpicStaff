from typing import Any, List, TypedDict
import pandas as pd
import time
import re
from langgraph.graph import StateGraph
from langchain_community.agent_toolkits import GmailToolkit
from langchain_community.tools.gmail.search import GmailSearch
from bella.domain import Entities
import sys


# app = Flask(__name__)

class Nodes:
	def __init__(self):
		self.gmail = GmailToolkit()

	def check_email(self, state):
		print("# Checking for new emails")
		search = GmailSearch(api_resource=self.gmail.api_resource)
		emails = search('after:newer_than:1d')
		checked_emails = state['checked_emails_ids'] if 'checked_emails_ids' in state else []
		new_emails = []
		for email in emails:
			if email['id'] not in checked_emails:
				new_emails.append(email)
				checked_emails.append(email['id'])
		state['emails'] = new_emails
		state['checked_emails_ids'] = checked_emails
		print(f"State after checking emails: {state}")
		return state

	def wait_next_run(self, state):
		print("## Waiting for 180 seconds")
		time.sleep(180)
		return state

	def new_emails(self, state):
		if not state['emails']:
			print("## No new emails")
			return "wait"
		else:
			print("## New emails found")
			return "continue"

	def run_project(self, state):  # , project_name):
		print(f"Running project:")
		# return state


class EmailsState(TypedDict):
	checked_emails_ids: list[str]
	emails: list[dict]
	action_required_emails: dict


class Workflow:
	def __init__(self, domain_objects_df: pd.DataFrame, workflow_df: pd.DataFrame):
		self.workflow = StateGraph(EmailsState)  # StateGraph(Entities(domain_objects_df))
		self.workflow_df = workflow_df
		self.nodes = Nodes()
		self.function_map = self.create_function_map()
		self.conditional_edges = []  # Initialize the conditional_edges attribute
		self.added_nodes = set()  # Initialize the set to keep track of added nodes
		self.setup()
		self.app = self.workflow.compile()

	def create_function_map(self):
		"""Create a mapping of functions to their respective functions, including all node transitions."""
		function_map = {}
		# Include all nodes mentioned in the DataFrame
		all_nodes = self.workflow_df['Node'].dropna().unique()
		for node in all_nodes:
			# Extract the function name if specified, or print error message
			if self.workflow_df[self.workflow_df['Node'] == node].empty:
				print(f"It look like there's an empty node in the dataframe. This can't be right. {node}.")
				sys.exit(1)

			func = self.workflow_df[self.workflow_df['Node'] == node]['Function / Project'].iloc[0]
			if not func:
				print(f"Function not found for node {node}. Could you check the data?")
				sys.exit(1)

			match = re.match(r"nodes\.(\w+)(?:\((.*)\))?", func)
			if match:
				func_name, args = match.groups()
				if args:
					args = [arg.strip().strip('"').strip("'") for arg in args.split(',')]
				else:
					args = []
				func_attr = getattr(self.nodes, func_name, None)
				if func_attr:
					function_map[node] = func_attr
					print(f"Mapping {func} to {func_attr}. ")
		return function_map

	def setup(self):
		for _, row in self.workflow_df.iterrows():
			node = row['Node']
			function = self.function_map.get(node)
			self.workflow.add_node(node, function)
			self.added_nodes.add(node)
			print(f"Added node {node} with function {function}")
			if row['Entry Point']:
				self.workflow.set_entry_point(node)
				print(f"Set entry point to {node}")
		self.setup_edges()

	def setup_edges(self):
		"""
		Add simple edges and conditional edges from DataFrame.
		Ensure all nodes are registered before adding edges, using an internal set for tracking.
		"""
		for _, row in self.workflow_df.iterrows():
			node = row['Node']
			next_node = row['Next Node']

			# Add the edge if the next node is not empty
			if pd.notna(next_node):
				self.workflow.add_edge(node, next_node)
				print(f"Added edge from {node} to {next_node}")

			# Conditional edge setup
			if pd.notna(row['Decision Table To look up']):
				self.setup_conditional_edges_from_df(node, row['Decision Table To look up'])
		print(self.to_mermaid())

	def setup_conditional_edges_from_df(self, source, decision_table_name):
		decision_rows = self.workflow_df[self.workflow_df['Decision Table Name'] == decision_table_name]
		print(f"Decision rows: \n{decision_rows}")
		if decision_rows.empty:
			raise ValueError(f"No decision rows found for decision table name: {decision_table_name}")
		for decision_parameter, group in decision_rows.groupby('Decision Parameter'):
			conditional_mapping = {decision_row['Value']: decision_row['Node (Target Node for Decision)'] for
								   _, decision_row in group.iterrows()}

			if conditional_mapping and source and decision_parameter:
				self.workflow.add_conditional_edges(source, self.function_map.get(decision_parameter),
													conditional_mapping)
				print(f"Added conditional edges from {source} based on {decision_parameter}")
				# Store conditional edges for visualization
				for value, target in conditional_mapping.items():
					self.conditional_edges.append((source, f"{decision_parameter} == {value}", target))

	def to_mermaid(self):
		diagram = "graph TD\n"
		normal_edges = set()
		for edge in self.workflow.edges:
			from_node, to_node, *label = edge
			label_str = f" -- \"{label[0]}\" -->" if label else " -->"
			normal_edges.add((from_node, to_node, label_str))

		# Handle conditional edges
		conditional_edges = set()
		for source, condition, target in self.conditional_edges:
			if condition != " == ":  # Avoid adding edges with empty conditions
				label_str = f" -- \"{condition}\" -->"
				conditional_edges.add((source, target, label_str))

		# Add edges to diagram, avoiding duplicates
		for from_node, to_node, label_str in normal_edges | conditional_edges:
			diagram += f"    {from_node}{label_str} {to_node}\n"

		return diagram


def main():

	from utils import load_env
	load_env("../ENV/.env", ["OPENAI_API_KEY", ])
	workflow_data = {
		'Process': ['Draft Responses', 'Draft Responses', 'Draft Responses'],
		'Entry Point': [True, False, False],
		'Node': ['check_new_emails', 'draft_responses', 'wait_next_run'],
		'Launch Project': [False, True, False],
		'Function / Project': ['nodes.check_email', 'nodes.run_project', 'nodes.wait_next_run'],
		'Next Node': [None, 'wait_next_run', 'check_new_emails'],
		'Decision Table To look up': ['check_new_emails', None, None],
		'Decision Table Name': ['check_new_emails', 'check_new_emails', ''],
		'Decision Parameter': ['new_emails', 'new_emails', None],
		'Value': ['continue', 'wait', None],
		'Node (Target Node for Decision)': ['draft_responses', 'wait_next_run', None]
	}

	domain_objects = {
		'Type': ['Object'],
		'Entity': ['EmailState:TypedDict'],
		'Attributes': ["checked_emails_ids:list[str], emails:list[dict], action_required_emails:list[dict]"],
		'Comment': ['Schema for storing email states']
	}

	domain_objects_df = pd.DataFrame(domain_objects)
	entities = Entities(domain_objects_df)

	# Example of detailed debugging
	print(f"Debug: EmailState type is {type(entities['EmailState'])}")
	print(f"Debug: EmailState annotations are {getattr(entities['EmailState'], '__annotations__', 'No annotations')}")

	# If you suspect isinstance checks are failing:
	# print(f"Debug: Is EmailState a TypedDict? {'yes' if isinstance(entities['EmailState'], TypedDict) else 'no'}")

	# def print_entities(entities):
	#     print("Created Entities:")
	#     for entity_name, entity_class in entities.items():
	#         print(f"\nEntity Name: {entity_name}")
	#         if hasattr(entity_class, '__annotations__'):
	#             print("Attributes:")
	#             for attr, attr_type in entity_class.__annotations__.items():
	#                 print(f"  {attr}: {attr_type}")
	#         else:
	#             print("No annotations available.")

	# # Call the function to print the entities
	# print_entities(entities)



	######## REQUIRE credentials.json and setup google api ########
	workflow_df = pd.DataFrame(workflow_data)
	app = Workflow(domain_objects_df, workflow_df).app
	app.get_graph().print_ascii()

	# Debug: Check the graph structure before invoking
	print(Workflow(domain_objects_df, workflow_df).to_mermaid())

	result = app.invoke({})

	# Debug: Check the result after invocation
	print("Result:", result)


if __name__ == "__main__":
	main()
