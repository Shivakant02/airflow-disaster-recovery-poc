from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
import time
import random

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

def start_task():
    """Start task - initializes the workflow"""
    print("Starting Client3 DAG 1 workflow...")
    sleep_time = random.uniform(5, 10)
    print(f"Processing for {sleep_time:.2f} seconds...")
    time.sleep(sleep_time)
    print("Start task completed!")
    return "start_completed"

def dev_testing_task():
    """Development testing task"""
    print("Running tests in development environment...")
    sleep_time = random.uniform(5, 10)
    print(f"Processing for {sleep_time:.2f} seconds...")
    time.sleep(sleep_time)
    print("Development testing completed!")
    return "dev_testing_completed"

def dev_integration_task():
    """Development integration task"""
    print("Running integration tests in dev...")
    sleep_time = random.uniform(5, 10)
    print(f"Processing for {sleep_time:.2f} seconds...")
    time.sleep(sleep_time)
    print("Development integration completed!")
    return "dev_integration_completed"

def end_task():
    """End task - finalizes the workflow"""
    print("Finalizing Client3 DAG 1 workflow...")
    sleep_time = random.uniform(5, 10)
    print(f"Processing for {sleep_time:.2f} seconds...")
    time.sleep(sleep_time)
    print("End task completed!")
    return "end_completed"

with DAG(
    'dev_testing_pipeline_dag_1',
    default_args=default_args,
    description='Client3 Development Testing Pipeline DAG 1',
    schedule_interval='@hourly',
    catchup=False,
    tags=['client3', 'development', 'testing'],
) as dag:

    start = PythonOperator(
        task_id='start',
        python_callable=start_task,
    )

    testing = PythonOperator(
        task_id='dev_testing_task',
        python_callable=dev_testing_task,
    )

    integration = PythonOperator(
        task_id='dev_integration_task',
        python_callable=dev_integration_task,
    )

    end = PythonOperator(
        task_id='end',
        python_callable=end_task,
    )

    start >> testing >> integration >> end
